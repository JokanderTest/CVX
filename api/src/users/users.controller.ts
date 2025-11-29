// src/users/users.controller.ts
import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';

class CreateUserDto {
  email: string;
  password: string;
  name?: string;
  locale?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: CreateUserDto) {
    const existing = await this.usersService.findByEmail(body.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const user = await this.usersService.createUser(body);

    // Do not return passwordHash
    const { passwordHash, ...safe } = user as any;
    return { ok: true, user: safe };
  }
}
