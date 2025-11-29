// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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
      expiresIn: accessExp, // pass number (seconds)
    });

    const refreshPayload = { sub: user.id };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExp, // pass number (seconds)
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
