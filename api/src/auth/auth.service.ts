// src/auth/auth.service.ts - SECURE VERSION
import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {
    const redisUrl = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  // ============================================
  // SECURITY CONSTANTS
  // ============================================
  private readonly CODE_LENGTH = 6;
  private readonly CODE_TTL_MINUTES = 15;
  private readonly CODE_MAX_ATTEMPTS = 5;
  private readonly CODE_LOCK_MINUTES = 30;
  private readonly RESEND_LIMIT = 5;
  
  // Rate limiting for login attempts
  private readonly LOGIN_MAX_ATTEMPTS = 5;
  private readonly LOGIN_LOCK_MINUTES = 15;

  // ============================================
  // CSRF TOKEN GENERATION
  // ============================================
  generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async validateCsrfToken(userId: string, token: string): Promise<boolean> {
    const key = `csrf:${userId}`;
    const stored = await this.redis.get(key);
    return stored === token;
  }

  async storeCsrfToken(userId: string, token: string): Promise<void> {
    const key = `csrf:${userId}`;
    // CSRF token expires after 1 hour
    await this.redis.set(key, token, 'EX', 3600);
  }

  // ============================================
  // LOGIN RATE LIMITING
  // ============================================
  private loginAttemptKey(email: string) {
    return `login_attempts:${email.toLowerCase()}`;
  }

  async checkLoginRateLimit(email: string): Promise<void> {
    const key = this.loginAttemptKey(email);
    const attempts = await this.redis.get(key);
    
    if (attempts && parseInt(attempts) >= this.LOGIN_MAX_ATTEMPTS) {
      const ttl = await this.redis.ttl(key);
      throw new ForbiddenException(
        `Too many login attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`
      );
    }
  }

  async incrementLoginAttempts(email: string): Promise<void> {
    const key = this.loginAttemptKey(email);
    const current = await this.redis.get(key);
    
    if (!current) {
      await this.redis.set(key, '1', 'EX', this.LOGIN_LOCK_MINUTES * 60);
    } else {
      await this.redis.incr(key);
    }
  }

  async resetLoginAttempts(email: string): Promise<void> {
    const key = this.loginAttemptKey(email);
    await this.redis.del(key);
  }

  // ============================================
  // USER VALIDATION
  // ============================================
  async validateUser(email: string, password: string) {
    // Check rate limit first
    await this.checkLoginRateLimit(email);

    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Increment attempts even for non-existent users to prevent enumeration
      await this.incrementLoginAttempts(email);
      return null;
    }

    const matched = await bcrypt.compare(password, user.passwordHash);
    
    if (!matched) {
      await this.incrementLoginAttempts(email);
      return null;
    }

    // Reset attempts on successful login
    await this.resetLoginAttempts(email);

    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async getUserSafe(userId: string | number) {
    const idStr = typeof userId === 'number' ? userId.toString() : userId;
    const user = await this.usersService.findById(idStr);
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  // ============================================
  // JWT PAYLOAD & TOKEN GENERATION
  // ============================================
  private getAccessPayload(user: any) {
    return { 
      sub: user.id, 
      email: user.email, 
      role: user.role ?? 'user',
      // Add fingerprint for additional security
      fp: this.generateFingerprint(user.id)
    };
  }

  private generateFingerprint(userId: string): string {
    // Generate a unique fingerprint for this session
    return crypto.createHash('sha256')
      .update(`${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex')
      .substring(0, 32);
  }

  private parseDurationToSeconds(raw: string | number | undefined, fallback = 2592000): number {
    if (raw === undefined || raw === null) return fallback;
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return Math.floor(raw);

    const s = String(raw).trim();
    if (/^\d+$/.test(s)) return parseInt(s, 10);

    const m = s.match(/^(\d+)\s*([smhd])$/i);
    if (m) {
      const val = parseInt(m[1], 10);
      const unit = m[2].toLowerCase();
      switch (unit) {
        case 's': return val;
        case 'm': return val * 60;
        case 'h': return val * 3600;
        case 'd': return val * 86400;
        default: return fallback;
      }
    }

    const parsed = parseInt(s.replace(/[^\d].*$/, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  async getTokens(user: any) {
    const accessPayload = this.getAccessPayload(user);

    // Shorter access token expiration (15 minutes recommended)
    const accessExpSec = this.parseDurationToSeconds(this.config.get('JWT_ACCESS_EXP'), 900);
    const refreshExpSec = this.parseDurationToSeconds(this.config.get('JWT_REFRESH_EXP'), 2592000);

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpSec,
    });

    const refreshPayload = { 
      sub: user.id,
      // Add jti (JWT ID) for token tracking
      jti: crypto.randomBytes(16).toString('hex')
    };
    
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpSec,
    });

    // Generate CSRF token
    const csrfToken = this.generateCsrfToken();
    await this.storeCsrfToken(user.id, csrfToken);

    return { accessToken, refreshToken, csrfToken };
  }

  // ============================================
  // REFRESH TOKEN MANAGEMENT
  // ============================================
  async saveRefreshToken(userId: string | number, refreshToken: string) {
    const userIdStr = typeof userId === 'number' ? userId.toString() : userId;
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const expiresInSec = this.parseDurationToSeconds(this.config.get('JWT_REFRESH_EXP'), 2592000);
    const expiresAt = new Date(Date.now() + expiresInSec * 1000);

    // Clean up old expired tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: userIdStr,
        expiresAt: { lt: new Date() }
      }
    });

    return this.prisma.refreshToken.create({
      data: {
        userId: userIdStr,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findValidTokenForUser(userId: string | number, token: string) {
    const userIdStr = typeof userId === 'number' ? userId.toString() : userId;

    const tokens = await this.prisma.refreshToken.findMany({
      where: { 
        userId: userIdStr, 
        revoked: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limit to prevent DOS
    });

    for (const t of tokens) {
      const ok = await bcrypt.compare(token, t.tokenHash);
      if (ok && t.expiresAt > new Date()) return t;
    }
    return null;
  }

  async rotateRefreshToken(oldTokenId: number, userId: string | number, newRefreshToken: string) {
    const userIdStr = typeof userId === 'number' ? userId.toString() : userId;
    const tokenHash = await bcrypt.hash(newRefreshToken, 10);

    const expiresInSec = this.parseDurationToSeconds(this.config.get('JWT_REFRESH_EXP'), 2592000);
    const expiresAt = new Date(Date.now() + expiresInSec * 1000);

    const newToken = await this.prisma.refreshToken.create({
      data: {
        userId: userIdStr,
        tokenHash,
        expiresAt,
      },
    });

    await this.prisma.refreshToken.update({
      where: { id: oldTokenId },
      data: { revoked: true, replacedBy: newToken.id },
    });

    return newToken;
  }

  async revokeRefreshToken(id: number) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  // ============================================
  // OTP CODE HELPERS
  // ============================================
  private genNumericCode(len = this.CODE_LENGTH) {
    const min = 10 ** (len - 1);
    const max = 10 ** len - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  private async hashPlain(plain: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
  }

  private async comparePlain(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }

  // ============================================
  // REGISTRATION FLOW (Redis-based)
  // ============================================
  private pendingKey(email: string) {
    return `pending_signup:${email.toLowerCase()}`;
  }

  async registerStart(name: string, email: string, password: string) {
    const emailLower = email.toLowerCase();

    // Validate password strength
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Check for existing user
    const existing = await this.prisma.user.findUnique({ where: { email: emailLower }});
    if (existing) throw new BadRequestException('Email already registered');

    // Check for existing pending
    const key = this.pendingKey(emailLower);
    const existingPending = await this.redis.get(key);
    if (existingPending) {
      throw new BadRequestException('A pending registration already exists. Use resend or wait.');
    }

    // Hash password and generate code
    const passwordHash = await bcrypt.hash(password, 12); // 12 rounds for better security
    const code = this.genNumericCode(this.CODE_LENGTH);
    const codeHash = await this.hashPlain(code);

    const payload = {
      name,
      email: emailLower,
      passwordHash,
      codeHash,
      createdAt: Date.now(),
      attempts: 0,
      resendCount: 0,
    };

    const ttl = this.CODE_TTL_MINUTES * 60;
    await this.redis.set(key, JSON.stringify(payload), 'EX', ttl);

    // Send verification email
    await this.mailService.sendVerificationEmail(
      emailLower, 
      emailLower, 
      code, 
      { expiresMinutes: this.CODE_TTL_MINUTES }
    );

    return { ok: true, expiresIn: ttl };
  }

  async resendRegisterCode(email: string) {
    const emailLower = email.toLowerCase();
    const key = this.pendingKey(emailLower);
    const raw = await this.redis.get(key);
    
    if (!raw) throw new BadRequestException('No pending registration found');

    const obj = JSON.parse(raw) as any;
    const resendCount = (obj.resendCount ?? 0) + 1;
    
    if (resendCount > this.RESEND_LIMIT) {
      throw new ForbiddenException('Resend limit exceeded');
    }

    // Generate new code
    const code = this.genNumericCode(this.CODE_LENGTH);
    const codeHash = await this.hashPlain(code);
    
    obj.codeHash = codeHash;
    obj.resendCount = resendCount;
    obj.createdAt = Date.now();
    obj.attempts = 0; // Reset attempts on resend

    const ttl = this.CODE_TTL_MINUTES * 60;
    await this.redis.set(key, JSON.stringify(obj), 'EX', ttl);

    await this.mailService.sendVerificationEmail(
      emailLower, 
      emailLower, 
      code, 
      { expiresMinutes: this.CODE_TTL_MINUTES }
    );

    return { ok: true, expiresIn: ttl };
  }

  async registerVerify(email: string, code: string) {
    const emailLower = email.toLowerCase();
    const key = this.pendingKey(emailLower);
    const raw = await this.redis.get(key);
    
    if (!raw) throw new BadRequestException('No pending registration or code expired');

    const obj = JSON.parse(raw) as any;

    // Check attempts
    const attempts = (obj.attempts ?? 0);
    if (attempts >= this.CODE_MAX_ATTEMPTS) {
      await this.redis.del(key);
      throw new ForbiddenException('Too many attempts. Please start registration again.');
    }

    // Verify code
    const match = await bcrypt.compare(code, obj.codeHash);
    
    if (!match) {
      obj.attempts = attempts + 1;
      await this.redis.set(key, JSON.stringify(obj), 'EX', this.CODE_TTL_MINUTES * 60);
      
      const remaining = this.CODE_MAX_ATTEMPTS - obj.attempts;
      throw new BadRequestException(
        `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
      );
    }

    // Double-check uniqueness (race condition protection)
    const exists = await this.prisma.user.findUnique({ where: { email: emailLower }});
    if (exists) {
      await this.redis.del(key);
      throw new BadRequestException('Email already registered');
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: emailLower,
        name: obj.name,
        passwordHash: obj.passwordHash,
        isEmailVerified: true,
      },
    });

    // Clean up pending registration
    await this.redis.del(key);

    // Generate tokens
    const tokens = await this.getTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash, ...safe } = user as any;
    return { 
      ok: true, 
      user: safe, 
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        csrfToken: tokens.csrfToken
      }
    };
  }

  // ============================================
  // EMAIL VERIFICATION (Legacy - for existing users)
  // ============================================
  async createEmailVerificationToken(userId: string, expiresMinutes = this.CODE_TTL_MINUTES): Promise<string> {
    const code = this.genNumericCode(this.CODE_LENGTH);
    const codeHash = await this.hashPlain(code);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
    const userIdStr = typeof userId === 'number' ? String(userId) : userId;

    const updateResult = await this.prisma.emailVerificationToken.updateMany({
      where: { userId: userIdStr },
      data: {
        tokenHash: codeHash,
        expiresAt,
        createdAt: new Date(),
        attempts: 0,
        maxAttempts: this.CODE_MAX_ATTEMPTS,
        resendCount: 1,
        type: 'code',
        used: false,
        lockedUntil: null,
      } as any,
    });

    if (updateResult.count === 0) {
      await this.prisma.emailVerificationToken.create({
        data: {
          userId: userIdStr,
          tokenHash: codeHash,
          expiresAt,
          type: 'code',
          attempts: 0,
          maxAttempts: this.CODE_MAX_ATTEMPTS,
          resendCount: 1,
          used: false,
        } as any,
      });
    }

    return code;
  }

  async verifyEmailToken(userId: string, tokenPlain: string): Promise<boolean> {
    const userIdStr = typeof userId === 'number' ? String(userId) : userId;
    const tokens = await this.prisma.emailVerificationToken.findMany({
      where: { userId: userIdStr },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (!tokens.length) return false;

    for (const t of tokens) {
      if (t.expiresAt < new Date()) continue;

      const lockedUntil = (t as any).lockedUntil as Date | null | undefined;
      if (lockedUntil && lockedUntil > new Date()) {
        return false;
      }

      const match = await this.comparePlain(tokenPlain, t.tokenHash);
      if (match) {
        await this.prisma.user.update({
          where: { id: userIdStr },
          data: { isEmailVerified: true },
        });

        await this.prisma.emailVerificationToken.deleteMany({
          where: { userId: userIdStr },
        });

        return true;
      } else {
        const attempts = ((t as any).attempts ?? 0) + 1;
        const maxAttempts = (t as any).maxAttempts ?? this.CODE_MAX_ATTEMPTS;
        const updateData: any = { attempts };
        
        if (attempts >= maxAttempts) {
          updateData.lockedUntil = new Date(Date.now() + this.CODE_LOCK_MINUTES * 60 * 1000);
        }
        
        await this.prisma.emailVerificationToken.update({
          where: { id: t.id },
          data: updateData,
        });
      }
    }

    return false;
  }

  async sendVerificationEmail(userIdOrEmail: string, tokenPlain: string) {
    const maybeUser = await this.prisma.user.findUnique({
      where: { id: userIdOrEmail },
      select: { email: true, name: true },
    });

    const to = maybeUser?.email ?? userIdOrEmail;
    if (!to) throw new NotFoundException('User not found');

    await this.mailService.sendVerificationEmail(
      to, 
      userIdOrEmail, 
      tokenPlain, 
      { expiresMinutes: this.CODE_TTL_MINUTES }
    );

    return true;
  }
}