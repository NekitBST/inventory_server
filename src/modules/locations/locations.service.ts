import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationsRepo: Repository<Location>,
  ) {}

  async findAll(): Promise<Location[]> {
    return this.locationsRepo.find({ order: { id: 'ASC' } });
  }

  async findById(id: number): Promise<Location> {
    const location = await this.locationsRepo.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Локация не найдена');
    return location;
  }

  async create(dto: CreateLocationDto): Promise<Location> {
    const existing = await this.locationsRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Локация с таким именем уже существует');
    }

    const location = this.locationsRepo.create({ name: dto.name });
    return this.locationsRepo.save(location);
  }

  async update(id: number, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.findById(id);

    if (dto.name !== undefined && dto.name !== location.name) {
      const existing = await this.locationsRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Локация с таким именем уже существует');
      }
      location.name = dto.name;
    }

    return this.locationsRepo.save(location);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);

    const usageRows = await this.locationsRepo.query(
      `SELECT 1 FROM equipment WHERE location_id = $1 LIMIT 1`,
      [id],
    );

    if (usageRows.length > 0) {
      throw new ConflictException(
        'Нельзя удалить локацию, которая используется оборудованием',
      );
    }

    await this.locationsRepo.delete(id);
  }
}
