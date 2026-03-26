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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({ relations: ['role'] });
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
      user.passwordHash = await hash(dto.password);
      await this.invalidateAllSessions(user.id);
    }

    return this.usersRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    user.isActive = false;
    await this.usersRepo.save(user);
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
