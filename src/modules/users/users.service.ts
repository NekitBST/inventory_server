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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

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

}
