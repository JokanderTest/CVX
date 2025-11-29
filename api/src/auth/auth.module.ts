// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailVerifiedGuard } from './email-verified.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || 'fallback_access_secret',
        // expiresIn can be a number (seconds) or string like '900s'
        signOptions: { expiresIn: `${config.get('JWT_ACCESS_EXP') || 900}s` },
      }),
    }),
    // use forwardRef to avoid circular dependency if UsersModule imports AuthModule
    forwardRef(() => UsersModule),
    PrismaModule,
    MailModule,
  ],
  providers: [AuthService, JwtStrategy, EmailVerifiedGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
