import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../redis/redis.service';
import { LoginDto } from './dto/login.dto';

interface AccessPayload {
  sub: string;
  email: string;
  role: string;
  sid?: string;
  jti?: string;
  ver?: number;
  exp?: number;
}

interface RefreshPayload {
  sub: string;
  email: string;
  role: string;
  sid?: string;
  ver?: number;
}

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

    const sessionId = randomUUID();
    return this.generateTokens(user.id, user.email, user.role.name, sessionId);
  }

  async refresh(refreshToken: string) {
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Невалидный refresh-токен');
    }

    const tokenVersion = await this.getTokenVersion(payload.sub);
    if ((payload.ver ?? 0) !== tokenVersion) {
      throw new UnauthorizedException('Сессия устарела, выполните вход заново');
    }

    const sessionId = payload.sid ?? randomUUID();
    const refreshKey = this.getRefreshKey(payload.sub, sessionId);
    const legacyRefreshKey = this.getLegacyRefreshKey(payload.sub);

    let stored = await this.redis.get(refreshKey);
    if (!stored) {
      stored = await this.redis.get(legacyRefreshKey);
    }

    if (!stored || stored !== refreshToken) {
      throw new UnauthorizedException('Refresh-токен не найден или устарел');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user.isActive) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    if (!payload.sid) {
      await this.redis.del(legacyRefreshKey);
    }

    return this.generateTokens(user.id, user.email, user.role.name, sessionId);
  }

  async logout(userId: string, authorizationHeader?: string): Promise<void> {
    const token = this.extractBearerToken(authorizationHeader);
    if (!token) throw new UnauthorizedException('Отсутствует access-токен');

    let payload: AccessPayload;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Невалидный access-токен');
    }

    if (payload.sub !== userId) {
      throw new UnauthorizedException(
        'Токен не принадлежит текущему пользователю',
      );
    }

    if (payload.jti && payload.exp) {
      const secondsLeft = Math.max(
        payload.exp - Math.floor(Date.now() / 1000),
        1,
      );
      await this.redis.set(
        this.getAccessBlacklistKey(payload.jti),
        '1',
        secondsLeft,
      );
    }

    if (payload.sid) {
      await this.redis.del(this.getRefreshKey(userId, payload.sid));
      await this.redis.srem(this.getSessionsKey(userId), payload.sid);
      return;
    }

    await this.redis.del(this.getLegacyRefreshKey(userId));
  }

  async logoutAll(userId: string): Promise<void> {
    await this.redis.incr(this.getTokenVersionKey(userId));

    const sessionsKey = this.getSessionsKey(userId);
    const sessionIds = await this.redis.smembers(sessionsKey);
    const refreshKeys = sessionIds.map((sid) =>
      this.getRefreshKey(userId, sid),
    );

    if (refreshKeys.length > 0) {
      await this.redis.del(...refreshKeys);
    }

    await this.redis.del(sessionsKey, this.getLegacyRefreshKey(userId));
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    sessionId: string,
  ) {
    const tokenVersion = await this.getTokenVersion(userId);

    const accessPayload = {
      sub: userId,
      email,
      role,
      sid: sessionId,
      ver: tokenVersion,
      jti: randomUUID(),
    };

    const refreshPayload = {
      sub: userId,
      email,
      role,
      sid: sessionId,
      ver: tokenVersion,
      jti: randomUUID(),
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get('jwt.accessExpiresIn') as any,
    });

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get('jwt.refreshExpiresIn') as any,
    });

    const ttl = this.config.get<number>('jwt.refreshTtlSeconds') as number;
    await this.redis.set(
      this.getRefreshKey(userId, sessionId),
      refreshToken,
      ttl,
    );
    await this.redis.sadd(this.getSessionsKey(userId), sessionId);

    return { accessToken, refreshToken };
  }

  private getRefreshKey(userId: string, sessionId: string): string {
    return `refresh:${userId}:${sessionId}`;
  }

  private getLegacyRefreshKey(userId: string): string {
    return `refresh:${userId}`;
  }

  private getSessionsKey(userId: string): string {
    return `sessions:${userId}`;
  }

  private getTokenVersionKey(userId: string): string {
    return `authv:${userId}`;
  }

  private getAccessBlacklistKey(jti: string): string {
    return `bl:access:${jti}`;
  }

  private async getTokenVersion(userId: string): Promise<number> {
    const raw = await this.redis.get(this.getTokenVersionKey(userId));
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader) return null;
    const [type, token] = authorizationHeader.split(' ');
    if (type !== 'Bearer' || !token) return null;
    return token;
  }
}
