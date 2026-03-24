import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoriesService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoriesRepo: Repository<Inventory>,
  ) {}

  async create(createdBy: string): Promise<Inventory> {
    const activeInventory = await this.inventoriesRepo.findOne({
      where: { createdBy, status: 'OPEN' },
    });

    if (activeInventory) {
      throw new ConflictException(
        'Сначала закройте текущую инвентаризацию перед созданием новой',
      );
    }

    const inventory = this.inventoriesRepo.create({
      createdBy,
      status: 'OPEN',
      finishedAt: null,
    });

    try {
      return await this.inventoriesRepo.save(inventory);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as { code?: string; constraint?: string }).code === '23505' &&
        (error as { code?: string; constraint?: string }).constraint ===
          'uq_inventories_open_per_user'
      ) {
        throw new ConflictException(
          'Сначала закройте текущую инвентаризацию перед созданием новой',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Inventory[]> {
    return this.inventoriesRepo.find({
      relations: ['createdByUser'],
      order: { startedAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Inventory> {
    const inventory = await this.inventoriesRepo.findOne({
      where: { id },
      relations: ['createdByUser'],
    });
    if (!inventory) throw new NotFoundException('Инвентаризация не найдена');
    return inventory;
  }

  async close(id: string): Promise<Inventory> {
    const inventory = await this.findById(id);
    if (inventory.status === 'CLOSED') {
      throw new ConflictException('Инвентаризация уже закрыта');
    }

    inventory.status = 'CLOSED';
    inventory.finishedAt = new Date();
    return this.inventoriesRepo.save(inventory);
  }
}
