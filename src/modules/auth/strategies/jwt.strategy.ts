import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';
import { RedisService } from '../../../redis/redis.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sid?: string;
  jti?: string;
  ver?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret') as string,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const currentVersion = await this.getTokenVersion(payload.sub);
    if ((payload.ver ?? 0) !== currentVersion) {
      throw new UnauthorizedException();
    }

    if (payload.jti) {
      const isBlacklisted = await this.redis.get(
        this.getAccessBlacklistKey(payload.jti),
      );
      if (isBlacklisted) throw new UnauthorizedException();
    }

    let user: User;
    try {
      user = await this.usersService.findById(payload.sub);
    } catch {
      throw new UnauthorizedException();
    }
    if (!user.isActive) throw new UnauthorizedException();
    return user;
  }

  private getAccessBlacklistKey(jti: string): string {
    return `bl:access:${jti}`;
  }

  private getTokenVersionKey(userId: string): string {
    return `authv:${userId}`;
  }

  private async getTokenVersion(userId: string): Promise<number> {
    const raw = await this.redis.get(this.getTokenVersionKey(userId));
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
