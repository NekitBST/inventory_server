import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { InventoryRecord } from './entities/inventory-record.entity';
import { CreateInventoryRecordDto } from './dto/create-inventory-record.dto';
import { UpdateInventoryRecordDto } from './dto/update-inventory-record.dto';
import { Inventory } from '../inventories/entities/inventory.entity';
import { Equipment } from '../equipment/entities/equipment.entity';

@Injectable()
export class InventoryRecordsService {
  constructor(
    @InjectRepository(InventoryRecord)
    private readonly recordsRepo: Repository<InventoryRecord>,
    @InjectRepository(Inventory)
    private readonly inventoriesRepo: Repository<Inventory>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

  async create(dto: CreateInventoryRecordDto): Promise<InventoryRecord> {
    const inventory = await this.inventoriesRepo.findOne({
      where: { id: dto.inventoryId },
    });
    if (!inventory) throw new NotFoundException('Инвентаризация не найдена');
    if (inventory.status !== 'OPEN') {
      throw new ConflictException(
        'Нельзя добавлять записи в закрытую инвентаризацию',
      );
    }

    const equipment = await this.equipmentRepo.findOne({
      where: { id: dto.equipmentId },
    });
    if (!equipment) throw new NotFoundException('Оборудование не найдено');

    const record = this.recordsRepo.create({
      inventoryId: dto.inventoryId,
      equipmentId: dto.equipmentId,
      comment: dto.comment ?? null,
      resultStatus: 'FOUND',
    });

    try {
      return await this.recordsRepo.save(record);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as { code?: string; constraint?: string }).code === '23505' &&
        (error as { code?: string; constraint?: string }).constraint ===
          'uq_inventory_equipment'
      ) {
        throw new ConflictException(
          'Для этого оборудования уже есть запись в данной инвентаризации',
        );
      }
      throw error;
    }
  }

  async findByInventory(inventoryId: string): Promise<InventoryRecord[]> {
    const inventory = await this.inventoriesRepo.findOne({
      where: { id: inventoryId },
    });
    if (!inventory) throw new NotFoundException('Инвентаризация не найдена');

    return this.recordsRepo.find({
      where: { inventoryId },
      order: { scannedAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateInventoryRecordDto,
  ): Promise<InventoryRecord> {
    const record = await this.recordsRepo.findOne({ where: { id } });
    if (!record)
      throw new NotFoundException('Запись инвентаризации не найдена');

    const inventory = await this.inventoriesRepo.findOne({
      where: { id: record.inventoryId },
    });
    if (!inventory) throw new NotFoundException('Инвентаризация не найдена');
    if (inventory.status !== 'OPEN') {
      throw new ConflictException(
        'Нельзя изменять записи закрытой инвентаризации',
      );
    }

    if (dto.comment !== undefined) {
      record.comment = dto.comment;
    }
    if (dto.resultStatus !== undefined) {
      record.resultStatus = dto.resultStatus;
    }

    return this.recordsRepo.save(record);
  }
}
