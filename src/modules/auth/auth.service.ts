import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../redis/redis.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.generateTokens(user.id, user.email, user.role.name);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Невалидный refresh-токен');
    }

    const stored = await this.redis.get(`refresh:${payload.sub}`);
    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Refresh-токен не найден или устарел');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user.isActive) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    return this.generateTokens(user.id, user.email, user.role.name);
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}`);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get('jwt.accessExpiresIn') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get('jwt.refreshExpiresIn') as any,
    });

    const ttl = this.config.get<number>('jwt.refreshTtlSeconds') as number;
    await this.redis.set(`refresh:${userId}`, refreshToken, ttl);

    return { accessToken, refreshToken };
  }
}
