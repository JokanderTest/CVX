// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Find user by email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Find user by ID (accept string or number)
  async findById(id: string | number) {
    const idStr = typeof id === 'number' ? id.toString() : id;
    return this.prisma.user.findUnique({
      where: { id: idStr },
    });
  }


  // Create new user
  async createUser(data: {
    email: string;
    password: string;
    name?: string;
    locale?: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        name: data.name,
        locale: data.locale ?? 'en',
      },
    });
  }

  // Remove passwordHash before returning user object
  sanitize(user: any) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  }
}
