// src/auth/auth.controller.ts - SECURE VERSION
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
  Headers,
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
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 900; // 15 minutes default
  }

  private isProduction(): boolean {
    return this.config.get('NODE_ENV') === 'production';
  }

  private buildCookieOptions(maxAgeSeconds: number) {
    return {
      httpOnly: true,
      secure: this.isProduction(), // true in production (HTTPS required)
      sameSite: 'strict' as const, // Better CSRF protection
      domain: this.isProduction() ? this.config.get('COOKIE_DOMAIN') : 'localhost',
      path: '/',
      maxAge: maxAgeSeconds * 1000,
    };
  }

  private setCookies(res: Response, tokens: { accessToken: string; refreshToken: string; csrfToken: string }) {
    const refreshExpSec = this.getRefreshExpSeconds();
    const accessExpSec = this.getAccessExpSeconds();

    // Set refresh token in HttpOnly cookie
    res.cookie('refresh_token', tokens.refreshToken, this.buildCookieOptions(refreshExpSec));
    
    // Set access token in HttpOnly cookie (SECURE!)
    res.cookie('access_token', tokens.accessToken, this.buildCookieOptions(accessExpSec));
    
    // Set CSRF token in regular cookie (readable by JS for sending in headers)
    res.cookie('csrf_token', tokens.csrfToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: this.isProduction(),
      sameSite: 'strict' as const,
      domain: this.isProduction() ? this.config.get('COOKIE_DOMAIN') : 'localhost',
      path: '/',
      maxAge: accessExpSec * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    const clearOptions = {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'strict' as const,
      domain: this.isProduction() ? this.config.get('COOKIE_DOMAIN') : 'localhost',
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

    // Validate against stored token in Redis
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(body.email, body.password);

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    // Check email verification
    if (!user.isEmailVerified) {
      return { 
        ok: false, 
        error: 'email_not_verified', 
        user: { id: user.id, email: user.email } 
      };
    }

    // Generate tokens
    const tokens = await this.authService.getTokens(user);
    await this.authService.saveRefreshToken(user.id, tokens.refreshToken);

    // Set secure cookies
    this.setCookies(res, tokens);

    // SECURITY: Don't return tokens in response body
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
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refreshes per minute
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

    // Rotate refresh token
    await this.authService.rotateRefreshToken(tokenRecord.id, user.id, newTokens.refreshToken);

    // Set new cookies
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
        // Ignore errors during logout
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
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 registrations per minute
  async registerStart(@Body() body: RegisterStartDto) {
    const { name, email, password } = body;
    
    if (!name || !email || !password) {
      throw new BadRequestException('Missing required fields');
    }

    // Basic email validation
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
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 resends per 5 minutes
  async resendRegisterCode(@Body() body: ResendRegisterDto) {
    const { email } = body;
    
    if (!email) {
      throw new BadRequestException('Missing email');
    }

    return this.authService.resendRegisterCode(email);
  }

  // ============================================
  // EMAIL VERIFICATION (for existing users)
  // ============================================

  @UseGuards(AuthGuard('jwt'))
  @Post('request-email-verification')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  async requestEmailVerification(@Req() req: Request) {
    const userId = (req as any).user?.id;
    
    // Validate CSRF
    await this.validateCsrf(req, userId);

    const token = await this.authService.createEmailVerificationToken(userId);
    await this.authService.sendVerificationEmail(userId, token);
    
    return { ok: true, message: 'Verification code sent to your email' };
  }

  @Post('verify-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyEmail(@Query('token') token: string, @Query('uid') uid: string) {
    if (!token || !uid) {
      throw new BadRequestException('Missing token or user ID');
    }

    const ok = await this.authService.verifyEmailToken(uid, token);
    
    if (!ok) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    return { ok: true, message: 'Email verified successfully' };
  }

  // ============================================
  // PROTECTED ROUTES
  // ============================================

  @UseGuards(AuthGuard('jwt'), EmailVerifiedGuard)
  @Get('test-protected')
  async testProtected(@Req() req: Request) {
    // Validate CSRF for state-changing operations
    // For GET requests, CSRF is optional but recommended for sensitive data
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

    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: this.isProduction(),
      sameSite: 'strict' as const,
      domain: this.isProduction() ? this.config.get('COOKIE_DOMAIN') : 'localhost',
      path: '/',
      maxAge: 3600000, // 1 hour
    });

    return { ok: true, csrfToken };
  }
}