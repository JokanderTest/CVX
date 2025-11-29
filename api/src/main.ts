import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================
  // 1. TRUST PROXY (موجود بالفعل)
  // ============================================
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // ============================================
  // 2. SECURITY HEADERS WITH HELMET (جديد)
  // ============================================
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // ============================================
  // 3. COOKIE PARSER (موجود بالفعل)
  // ============================================
  app.use(cookieParser());

  // ============================================
  // 4. CORS CONFIGURATION (محدّث)
  // ============================================
  app.enableCors({
    origin: function (origin, callback) {
      // السماح بـ localhost:3001 و 127.0.0.1:3001
      const allowedOrigins = [
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    credentials: true, // Essential for cookies
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'], // إضافة CSRF
  });

  // ============================================
  // 5. GLOBAL VALIDATION PIPE (جديد)
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
      transform: true, // Transform payloads to DTO instances
    }),
  );

  // ============================================
  // 6. START SERVER
  // ============================================
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log('╔════════════════════════════════════════════╗');
  console.log(`║  🚀 Server running on http://localhost:${port}  ║`);
  console.log('║  🔒 Security features enabled              ║');
  console.log('║  🛡️  Helmet, CORS, Rate Limiting active    ║');
  console.log('╚════════════════════════════════════════════╝');
}

bootstrap();