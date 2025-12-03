// src/auth/auth.controller.ts - PERSISTENT COOKIES VERSION
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  Req,
  BadRequestException,
  HttpCode,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { EmailVerifiedGuard } from './email-verified.guard';
import { LoginDto, RegisterStartDto, RegisterVerifyDto, ResendRegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  // ============================================
  // HELPER METHODS
  // ============================================
  private getRefreshExpSeconds(): number {
    const raw = String(this.config.get('JWT_REFRESH_EXP') ?? '');
    const parsed = parseInt(raw.replace(/\D+$/, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 2592000;
  }

  private getAccessExpSeconds(): number {
    const raw = String(this.config.get('JWT_ACCESS_EXP') ?? '');
    const parsed = parseInt(raw.replace(/\D+$/, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 900;
  }

  private isProduction(): boolean {
    return this.config.get('NODE_ENV') === 'production';
  }

  private buildCookieOptions(maxAgeSeconds: number) {
    const isProd = this.isProduction();
    
    // ✅ التعديل الجوهري: حساب تاريخ الانتهاء لضمان الحفظ
    const expiresDate = new Date(Date.now() + maxAgeSeconds * 1000);

    return {
      httpOnly: true,
      secure: isProd, // false on localhost
      sameSite: 'lax' as const,
      domain: isProd ? this.config.get('COOKIE_DOMAIN') : undefined,
      path: '/',
      maxAge: maxAgeSeconds * 1000,
      expires: expiresDate, // ✅ هذا السطر يمنع حذف الكوكي عند غلق المتصفح
    };
  }

  private setCookies(res: Response, tokens: { accessToken: string; refreshToken: string; csrfToken: string }) {
    const refreshExpSec = this.getRefreshExpSeconds();
    const accessExpSec = this.getAccessExpSeconds();
    const isProd = this.isProduction();

    // Set refresh token (Persistent - 30 days)
    res.cookie('refresh_token', tokens.refreshToken, this.buildCookieOptions(refreshExpSec));
    
    // Set access token (Persistent until expires - 15 mins)
    res.cookie('access_token', tokens.accessToken, this.buildCookieOptions(accessExpSec));
    
    // Set CSRF token
    const csrfExpiresDate = new Date(Date.now() + accessExpSec * 1000);
    res.cookie('csrf_token', tokens.csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax' as const,
      domain: isProd ? this.config.get('COOKIE_DOMAIN') : undefined,
      path: '/',
      maxAge: accessExpSec * 1000,
      expires: csrfExpiresDate, // ✅ إضافة تاريخ الانتهاء هنا أيضاً
    });
  }

  private clearAuthCookies(res: Response) {
    const isProd = this.isProduction();
    
    const clearOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      domain: isProd ? this.config.get('COOKIE_DOMAIN') : undefined, 
      path: '/',
    };

    res.clearCookie('refresh_token', clearOptions);
    res.clearCookie('access_token', clearOptions);
    res.clearCookie('csrf_token', { ...clearOptions, httpOnly: false });
  }

  // Validate CSRF token from header
  private async validateCsrf(req: Request, userId: string): Promise<void> {
    const csrfFromHeader = req.headers['x-csrf-token'] as string;
    const csrfFromCookie = req.cookies['csrf_token'];

    if (!csrfFromHeader || !csrfFromCookie) {
      throw new UnauthorizedException('CSRF token missing');
    }

    if (csrfFromHeader !== csrfFromCookie) {
      throw new UnauthorizedException('CSRF token mismatch');
    }

    const isValid = await this.authService.validateCsrfToken(userId, csrfFromHeader);
    if (!isValid) {
      throw new UnauthorizedException('Invalid CSRF token');
    }
  }

  // ============================================
  // AUTHENTICATION ENDPOINTS
  // ============================================

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(body.email, body.password);

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      return { 
        ok: false, 
        error: 'email_not_verified', 
        user: { id: user.id, email: user.email } 
      };
    }

    const tokens = await this.authService.getTokens(user);
    await this.authService.saveRefreshToken(user.id, tokens.refreshToken);

    this.setCookies(res, tokens);

    return { 
      ok: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      }
    };
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookie = req.cookies['refresh_token'];
    
    if (!cookie) {
      throw new BadRequestException('No refresh token found');
    }

    let payload;
    try {
      payload = this.jwtService.verify(cookie, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenRecord = await this.authService.findValidTokenForUser(payload.sub, cookie);
    
    if (!tokenRecord) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    const user = await this.authService.getUserSafe(payload.sub);
    const newTokens = await this.authService.getTokens(user);

    await this.authService.rotateRefreshToken(tokenRecord.id, user.id, newTokens.refreshToken);

    this.setCookies(res, newTokens);

    return { 
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
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
        if (tokenRecord) {
          await this.authService.revokeRefreshToken(tokenRecord.id);
        }
      } catch (error) {
        // Ignore errors
      }
    }

    this.clearAuthCookies(res);
    return { ok: true };
  }

  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  async logoutAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user?.id;
    
    if (userId) {
      await this.authService.revokeAllUserTokens(userId);
    }

    this.clearAuthCookies(res);
    return { ok: true, message: 'Logged out from all devices' };
  }

  // ============================================
  // REGISTRATION ENDPOINTS
  // ============================================

  @Post('register-start')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async registerStart(@Body() body: RegisterStartDto) {
    const { name, email, password } = body;
    
    if (!name || !email || !password) {
      throw new BadRequestException('Missing required fields');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    const result = await this.authService.registerStart(name, email, password);
    return result;
  }

  @Post('register-verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async registerVerify(
    @Body() body: RegisterVerifyDto, 
    @Res({ passthrough: true }) res: Response
  ) {
    const { email, code } = body;
    
    if (!email || !code) {
      throw new BadRequestException('Missing email or code');
    }

    const out = await this.authService.registerVerify(email, code);

    if (out?.tokens) {
      this.setCookies(res, out.tokens);
    }

    return {
      ok: true,
      user: out.user,
    };
  }

  @Post('resend-register-code')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  async resendRegisterCode(@Body() body: ResendRegisterDto) {
    const { email } = body;
    
    if (!email) {
      throw new BadRequestException('Missing email');
    }

    return this.authService.resendRegisterCode(email);
  }

  @Get('google')
  redirectToGoogle(
    @Res() res: Response,
    @Query('origin') origin = 'login',
  ) {
    const url = this.authService.getGoogleAuthURL(origin === 'signup' ? 'signup' : 'login');
    return res.redirect(url);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Res() res: Response,
    @Req() req: Request,
    @Query('state') stateRaw?: string,
  ) {
    if (!code) {
      throw new BadRequestException('Missing code from Google callback');
    }

    const state = stateRaw === 'signup' ? 'signup' : 'login';

    try {
      const out = await this.authService.handleGoogleCallback(code, state);

      if (out?.tokens) {
        this.setCookies(res, {
          accessToken: out.tokens.accessToken,
          refreshToken: out.tokens.refreshToken,
          csrfToken: out.tokens.csrfToken,
        });
      }

      const frontend = this.config.get('FRONTEND_URL') || 'http://localhost:3001';
      return res.redirect(`${frontend}/dashboard`);
    } catch (err) {
      console.error('Google callback error:', err);
      const frontend = this.config.get('FRONTEND_URL') || 'http://localhost:3001';

      if (err instanceof BadRequestException) {
        const msg = encodeURIComponent((err as any)?.message ?? 'This account already exists. Please sign in.');
        return res.redirect(`${frontend}/auth/login?notice=already_linked&msg=${msg}`);
      }

      return res.redirect(`${frontend}/auth/error`);
    }
  }
 
  // ============================================
  // PROTECTED ROUTES
  // ============================================

  @UseGuards(AuthGuard('jwt'), EmailVerifiedGuard)
  @Get('test-protected')
  async testProtected(@Req() req: Request) {
    return { 
      ok: true, 
      message: 'Email is verified. Access granted.',
      user: (req as any).user
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('whoami')
  async whoami(@Req() req: Request) {
    return { 
      ok: true, 
      user: (req as any).user ?? null 
    };
  }

  @Get('csrf-token')
  @UseGuards(AuthGuard('jwt'))
  async getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const csrfToken = this.authService.generateCsrfToken();
    await this.authService.storeCsrfToken(userId, csrfToken);

    // حساب تاريخ انتهاء لـ CSRF لضمان بقائه أيضاً
    const expiresDate = new Date(Date.now() + 3600000); // ساعة واحدة

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: this.isProduction(),
      sameSite: 'lax' as const,
      domain: this.isProduction() ? this.config.get('COOKIE_DOMAIN') : undefined,
      path: '/',
      maxAge: 3600000,
      expires: expiresDate, // ✅ إضافة تاريخ الانتهاء
    });

    return { ok: true, csrfToken };
  }
}