import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EquipmentStatus } from './entities/equipment-status.entity';
import { CreateEquipmentStatusDto } from './dto/create-equipment-status.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';

@Injectable()
export class EquipmentStatusesService {
  constructor(
    @InjectRepository(EquipmentStatus)
    private readonly statusesRepo: Repository<EquipmentStatus>,
  ) {}

  async findAll(): Promise<EquipmentStatus[]> {
    return this.statusesRepo.find({ order: { id: 'ASC' } });
  }

  async findById(id: number): Promise<EquipmentStatus> {
    const status = await this.statusesRepo.findOne({ where: { id } });
    if (!status) throw new NotFoundException('Статус оборудования не найден');
    return status;
  }

  async create(dto: CreateEquipmentStatusDto): Promise<EquipmentStatus> {
    const existing = await this.statusesRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Статус с таким именем уже существует');
    }

    const status = this.statusesRepo.create({ name: dto.name });
    return this.statusesRepo.save(status);
  }

  async update(
    id: number,
    dto: UpdateEquipmentStatusDto,
  ): Promise<EquipmentStatus> {
    const status = await this.findById(id);

    if (dto.name !== undefined && dto.name !== status.name) {
      const existing = await this.statusesRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Статус с таким именем уже существует');
      }
      status.name = dto.name;
    }

    return this.statusesRepo.save(status);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);

    const usageRows = await this.statusesRepo.query(
      `SELECT 1 FROM equipment WHERE status_id = $1 LIMIT 1`,
      [id],
    );

    if (usageRows.length > 0) {
      throw new ConflictException(
        'Нельзя удалить статус, который используется оборудованием',
      );
    }

    await this.statusesRepo.delete(id);
  }
}
