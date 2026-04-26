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
import { FindEquipmentTypesQueryDto } from './dto/find-equipment-types-query.dto';

@Injectable()
export class EquipmentTypesService {
  constructor(
    @InjectRepository(EquipmentType)
    private readonly typesRepo: Repository<EquipmentType>,
  ) {}

  async findAll(params: FindEquipmentTypesQueryDto) {
    const page = params.page < 1 ? 1 : params.page;
    const limit =
      params.limit < 1 ? 20 : params.limit > 500 ? 500 : params.limit;
    const offset = (page - 1) * limit;

    const qb = this.typesRepo
      .createQueryBuilder('type')
      .orderBy('type.id', 'ASC')
      .skip(offset)
      .take(limit);

    if (params.search && params.search.trim().length > 0) {
      qb.andWhere('type.name ILIKE :search', {
        search: `%${params.search.trim()}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
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
