import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class InventoriesService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoriesRepo: Repository<Inventory>,
  ) {}

  async create(createdBy: string): Promise<Inventory> {
    const inventory = this.inventoriesRepo.create({
      createdBy,
      status: 'OPEN',
      finishedAt: null,
    });
    return this.inventoriesRepo.save(inventory);
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
