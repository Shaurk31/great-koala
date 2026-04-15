import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compare, hash } from 'bcryptjs';
import { User } from './user.entity';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

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
    const tokens = this.issueTokens(payload);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string; type?: string }>(refreshToken);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.users.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = this.issueTokens({ sub: user.id, email: user.email });
      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private issueTokens(payload: { sub: string; email: string }): AuthTokens {
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '8h' }),
      refreshToken: this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '30d' }),
    };
  }
}
