import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { FindInventoriesQueryDto } from './dto/find-inventories-query.dto';

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

  async findAll(params: FindInventoriesQueryDto) {
    const page = params.page < 1 ? 1 : params.page;
    const limit =
      params.limit < 1 ? 20 : params.limit > 100 ? 100 : params.limit;
    const offset = (page - 1) * limit;
    const sortOrder = params.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.inventoriesRepo
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.createdByUser', 'createdByUser')
      .orderBy('inventory.startedAt', sortOrder)
      .skip(offset)
      .take(limit);

    if (params.status !== undefined) {
      qb.andWhere('inventory.status = :status', { status: params.status });
    }

    if (params.search && params.search.trim().length > 0) {
      qb.andWhere('createdByUser.fullName ILIKE :search', {
        search: `%${params.search.trim()}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((inventory) => this.toInventoryWithUser(inventory)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Inventory> {
    const inventory = await this.inventoriesRepo.findOne({
      where: { id },
      relations: ['createdByUser'],
    });
    if (!inventory) throw new NotFoundException('Инвентаризация не найдена');
    return this.toInventoryWithUser(inventory);
  }

  async close(id: string): Promise<Inventory> {
    const inventory = await this.inventoriesRepo.findOne({ where: { id } });
    if (!inventory) throw new NotFoundException('Инвентаризация не найдена');

    if (inventory.status === 'CLOSED') {
      throw new ConflictException('Инвентаризация уже закрыта');
    }

    inventory.status = 'CLOSED';
    inventory.finishedAt = new Date();
    return this.inventoriesRepo.save(inventory);
  }

  private toInventoryWithUser(inventory: Inventory): Inventory {
    return {
      ...inventory,
      createdByUser: inventory.createdByUser
        ? {
            id: inventory.createdByUser.id,
            email: inventory.createdByUser.email,
            fullName: inventory.createdByUser.fullName,
            roleId: inventory.createdByUser.roleId,
          }
        : undefined,
    } as Inventory;
  }
}
