import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name?: string) {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

    const passwordHash = await hash(password, 10);
    const user = this.users.create({ email, passwordHash, name });
    return this.users.save(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) return null;
    const passwordValid = await compare(password, user.passwordHash);
    if (!passwordValid) return null;
    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
