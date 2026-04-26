import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'argon2';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RedisService } from '../../redis/redis.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  async findAll(params: FindUsersQueryDto) {
    const page = params.page < 1 ? 1 : params.page;
    const limit =
      params.limit < 1 ? 20 : params.limit > 500 ? 500 : params.limit;
    const offset = (page - 1) * limit;

    const qb = this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('user.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (params.search && params.search.trim().length > 0) {
      qb.andWhere('user.fullName ILIKE :search', {
        search: `%${params.search.trim()}%`,
      });
    }

    if (params.roleId !== undefined) {
      qb.andWhere('user.roleId = :roleId', { roleId: params.roleId });
    }

    if (params.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: params.isActive });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email уже занят');

    const passwordHash = await hash(dto.password);
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      roleId: dto.roleId,
    });
    return this.usersRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.roleId !== undefined) user.roleId = dto.roleId;
    if (dto.password !== undefined) {
      await this.setPassword(user, dto.password);
    }

    return this.usersRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    const defaultAdminLogin = process.env.ADMIN_LOGIN?.trim().toLowerCase();

    if (
      defaultAdminLogin &&
      user.email.trim().toLowerCase() === defaultAdminLogin
    ) {
      throw new ConflictException(
        'Нельзя деактивировать дефолтного администратора',
      );
    }

    if (!user.isActive) {
      throw new ConflictException('Пользователь уже деактивирован');
    }

    user.isActive = false;
    await this.usersRepo.save(user);
  }

  async restore(id: string): Promise<void> {
    const user = await this.findById(id);

    if (user.isActive) {
      throw new ConflictException('Пользователь уже активен');
    }

    user.isActive = true;
    await this.usersRepo.save(user);
  }

  async changePassword(userId: string, password: string): Promise<void> {
    const user = await this.findById(userId);
    await this.setPassword(user, password);
    await this.usersRepo.save(user);
  }

  private async setPassword(user: User, password: string): Promise<void> {
    user.passwordHash = await hash(password);
    await this.invalidateAllSessions(user.id);
  }

  private async invalidateAllSessions(userId: string): Promise<void> {
    await this.redis.incr(`authv:${userId}`);

    const sessionsKey = `sessions:${userId}`;
    const sessionIds = await this.redis.smembers(sessionsKey);
    const refreshKeys = sessionIds.map((sid) => `refresh:${userId}:${sid}`);

    if (refreshKeys.length > 0) {
      await this.redis.del(...refreshKeys);
    }

    await this.redis.del(sessionsKey, `refresh:${userId}`);
  }
}
