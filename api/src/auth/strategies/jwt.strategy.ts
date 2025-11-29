import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      // ============================================
      // CRITICAL CHANGE: Extract JWT from Cookie
      // NOT from Authorization header
      // ============================================
      jwtFromRequest: ExtractJwt.fromExtractors([
        // أولاً: حاول قراءة من HttpOnly cookie (الأمثل)
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        // ثانياً: احتياطي - قراءة من Authorization header (للتوافق مع القديم)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET') || 'fallback_access_secret',
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // Payload contains: { sub, email, role, fp (fingerprint), iat, exp }
    
    // Return user object that will be attached to request.user
    return { 
      id: payload.sub, 
      email: payload.email, 
      role: payload.role 
    };
  }
}