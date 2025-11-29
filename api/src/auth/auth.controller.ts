// src/auth/auth.controller.ts
import { Controller, Post, Body, Res, Req, BadRequestException, HttpCode } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';

class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private getRefreshExpSeconds(): number {
    const raw = String(this.config.get('JWT_REFRESH_EXP') ?? '');
    const parsed = parseInt(raw.replace(/\D+$/, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 2592000; // default 30 days
  }

  private buildCookieOptions() {
    const refreshExpSeconds = this.getRefreshExpSeconds();
    return {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE') === 'true',
      sameSite: 'lax' as const,
      domain: this.config.get('COOKIE_DOMAIN') || undefined,
      maxAge: refreshExpSeconds * 1000, // milliseconds
      path: '/',
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(body.email, body.password);

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    const tokens = await this.authService.getTokens(user);
    await this.authService.saveRefreshToken(user.id, tokens.refreshToken);

    const cookieOptions = this.buildCookieOptions();

    res.cookie('refresh_token', tokens.refreshToken, cookieOptions);

    return {
      ok: true,
      user,
      accessToken: tokens.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = req.cookies['refresh_token'];
    if (!cookie) throw new BadRequestException('No refresh token found');

    const payload = this.jwtService.verify(cookie, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });

    const tokenRecord = await this.authService.findValidTokenForUser(payload.sub, cookie);
    if (!tokenRecord) throw new BadRequestException('Invalid refresh token');

    const user = await this.authService.getUserSafe(payload.sub);
    const newTokens = await this.authService.getTokens(user);

    await this.authService.rotateRefreshToken(tokenRecord.id, user.id, newTokens.refreshToken);

    const cookieOptions = this.buildCookieOptions();

    res.cookie('refresh_token', newTokens.refreshToken, cookieOptions);

    return {
      ok: true,
      accessToken: newTokens.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = req.cookies['refresh_token'];
    if (cookie) {
      try {
        const payload = this.jwtService.verify(cookie, {
          secret: this.config.get('JWT_REFRESH_SECRET'),
        });
        const tokenRecord = await this.authService.findValidTokenForUser(payload.sub, cookie);
        if (tokenRecord) await this.authService.revokeRefreshToken(tokenRecord.id);
      } catch {}
    }

    res.clearCookie('refresh_token', { path: '/' });

    return { ok: true };
  }
}
