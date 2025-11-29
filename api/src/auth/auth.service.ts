// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // validate user credentials, return safe user object (no passwordHash) or null
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return null;
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  // return sanitized user from DB
  async getUserSafe(userId: string | number) {
    const idStr = typeof userId === 'number' ? userId.toString() : userId;
    const user = await this.usersService.findById(idStr);
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  private getAccessPayload(user: any) {
    return { sub: user.id, email: user.email, role: user.role ?? 'user' };
  }

  // produce access + refresh JWTs
  async getTokens(user: any) {
    const accessPayload = this.getAccessPayload(user);

    // ensure we pass a number of seconds (fallback to 900s if not configured)
    const accessExp = Number(this.config.get('JWT_ACCESS_EXP')) || 900;
    const refreshExp = Number(this.config.get('JWT_REFRESH_EXP')) || 2592000; // 30 days

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExp, // number (seconds)
    });

    const refreshPayload = { sub: user.id };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExp, // number (seconds)
    });

    return { accessToken, refreshToken };
  }

  // store hashed refresh token in DB
  async saveRefreshToken(userId: string | number, refreshToken: string) {
    const userIdStr = typeof userId === 'number' ? userId.toString() : userId;
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    // attempt to parse JWT_REFRESH_EXP robustly (accept "30d", "3600s", "2592000" etc.)
    const raw = String(this.config.get('JWT_REFRESH_EXP') ?? '');
    const parsed = parseInt(raw.replace(/\D+$/, ''), 10); // remove non-digit suffix if any
    const expiresInSec = Number.isFinite(parsed) && parsed > 0 ? parsed : 2592000; // fallback 30 days

    const expiresAt = new Date(Date.now() + expiresInSec * 1000);

    return this.prisma.refreshToken.create({
      data: {
        userId: userIdStr,
        tokenHash,
        expiresAt,
      },
    });
  }

  // Create + persist email verification token (returns the plain token to send by email)
  async createEmailVerificationToken(userId: string, expiresMinutes = 30): Promise<string> {
    const tokenPlain = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(tokenPlain, 10);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId: typeof userId === 'number' ? String(userId) : userId,
        expiresAt,
      },
    });

    return tokenPlain;
  }

  // Verify email token and update user status
  async verifyEmailToken(userId: string, tokenPlain: string): Promise<boolean> {
    const tokens = await this.prisma.emailVerificationToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (!tokens.length) {
      return false;
    }

    for (const t of tokens) {
      if (t.expiresAt < new Date()) continue;

      const match = await bcrypt.compare(tokenPlain, t.tokenHash);
      if (match) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { isEmailVerified: true },
        });

        await this.prisma.emailVerificationToken.deleteMany({
          where: { userId },
        });

        return true;
      }
    }

    return false;
  }

  // find valid (not revoked, not expired) token record matching the raw token
  async findValidTokenForUser(userId: string | number, token: string) {
    const userIdStr = typeof userId === 'number' ? userId.toString() : userId;

    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId: userIdStr, revoked: false },
      orderBy: { createdAt: 'desc' },
    });

    for (const t of tokens) {
      const ok = await bcrypt.compare(token, t.tokenHash);
      if (ok && t.expiresAt > new Date()) return t;
    }
    return null;
  }

  // Send verification email to user (single, clean implementation)
  async sendVerificationEmail(userId: string, tokenPlain: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const verifyUrl = `${this.config.get('APP_URL')}/auth/verify-email?token=${tokenPlain}&uid=${userId}`;

    const html = `
      <div style="font-family: Arial; padding:20px;">
        <h2>تفعيل البريد الإلكتروني</h2>
        <p>مرحباً ${user.name ?? 'مستخدم'},</p>
        <p>اضغط على الرابط التالي لتفعيل حسابك:</p>
        <a href="${verifyUrl}" style="color:blue;">تفعيل الحساب</a>
        <p>إذا لم تطلب هذا، فتجاهل الرسالة.</p>
      </div>
    `;

    await this.mailService.send(
      user.email,
      'تفعيل حسابك في CVX',
      html,
    );

    return true;
  }


  // rotate refresh tokens: create new record and revoke old
  async rotateRefreshToken(oldTokenId: number, userId: string | number, newRefreshToken: string) {
    const userIdStr = typeof userId === 'number' ? userId.toString() : userId;
    const tokenHash = await bcrypt.hash(newRefreshToken, 10);

    const raw = String(this.config.get('JWT_REFRESH_EXP') ?? '');
    const parsed = parseInt(raw.replace(/\D+$/, ''), 10);
    const expiresInSec = Number.isFinite(parsed) && parsed > 0 ? parsed : 2592000;

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
}
