import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './common/redis.module';

@Module({
  imports: [
    // ============================================
    // 1. GLOBAL CONFIGURATION
    // ============================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // ============================================
    // 2. RATE LIMITING (جديد - حماية من DDoS)
    // ============================================
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time window: 1 minute (in milliseconds)
      limit: 10,  // Max 10 requests per minute (global default)
    }]),

    // ============================================
    // 3. EXISTING MODULES (بدون تغيير)
    // ============================================
    RedisModule,   // Redis للـ CSRF tokens و pending registrations
    UsersModule,
    AuthModule,
  ],
  
  controllers: [AppController],
  providers: [
    AppService,
    
    // ============================================
    // 4. GLOBAL GUARDS (جديد)
    // ============================================
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting globally
    },
  ],
})
export class AppModule {}