// src/auth/email-verified.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as any; // what passport/jwt strategy attached

    // Accept different payload shapes: { sub } or { id }
    const userId = user?.sub ?? user?.id ?? null;
    if (!userId) {
      // No usable id in the authenticated payload — forbid access
      throw new ForbiddenException('Invalid authentication payload');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: String(userId) },
      select: { isEmailVerified: true },
    });

    if (!dbUser) throw new ForbiddenException('User not found');
    if (!dbUser.isEmailVerified) throw new ForbiddenException('Email not verified');

    return true;
  }
}
