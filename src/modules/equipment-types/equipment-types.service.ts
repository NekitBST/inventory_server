import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EquipmentType } from './entities/equipment-type.entity';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';

@Injectable()
export class EquipmentTypesService {
  constructor(
    @InjectRepository(EquipmentType)
    private readonly typesRepo: Repository<EquipmentType>,
  ) {}

  async findAll(): Promise<EquipmentType[]> {
    return this.typesRepo.find({ order: { id: 'ASC' } });
  }

  async findById(id: number): Promise<EquipmentType> {
    const type = await this.typesRepo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Тип оборудования не найден');
    return type;
  }

  async create(dto: CreateEquipmentTypeDto): Promise<EquipmentType> {
    const existing = await this.typesRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Тип с таким именем уже существует');
    }

    const type = this.typesRepo.create({ name: dto.name });
    return this.typesRepo.save(type);
  }

  async update(
    id: number,
    dto: UpdateEquipmentTypeDto,
  ): Promise<EquipmentType> {
    const type = await this.findById(id);

    if (dto.name !== undefined && dto.name !== type.name) {
      const existing = await this.typesRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Тип с таким именем уже существует');
      }
      type.name = dto.name;
    }

    return this.typesRepo.save(type);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);

    const usageRows = await this.typesRepo.query(
      `SELECT 1 FROM equipment WHERE type_id = $1 LIMIT 1`,
      [id],
    );

    if (usageRows.length > 0) {
      throw new ConflictException(
        'Нельзя удалить тип, который используется оборудованием',
      );
    }

    await this.typesRepo.delete(id);
  }
}
