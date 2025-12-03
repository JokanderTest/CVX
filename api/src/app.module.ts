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

import { ResumeEngineModule } from "./resume-engine/resume-engine.module";

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
    // 2. RATE LIMITING (حماية من DDoS)
    // ============================================
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time window: 1 minute (in milliseconds)
      limit: 10,  // Max 10 requests per minute (global default)
    }]),

    // ============================================
    // 3. EXISTING MODULES
    // ============================================
    RedisModule,
    UsersModule,
    AuthModule,

    // ============================================
    // 4. NEW CVX MODULE
    // ============================================
    ResumeEngineModule,
  ],
  
  controllers: [AppController],
  providers: [
    AppService,
    
    // ============================================
    // 5. GLOBAL GUARDS
    // ============================================
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
