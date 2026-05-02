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
import { FindInventoryRecordsQueryDto } from './dto/find-inventory-records-query.dto';
import { EquipmentAuditEvent } from '../equipment/entities/equipment-audit-event.entity';
import { User } from '../users/entities/user.entity';

function formatInventoryRecordValue(
  key: 'resultStatus' | 'comment',
  value: string | null,
): string {
  if (value === null || value === undefined || value === '') {
    return key === 'resultStatus' ? 'не указан' : 'пусто';
  }

  if (key === 'resultStatus') {
    return value === 'FOUND' ? 'Найдено' : value === 'DAMAGED' ? 'Повреждено' : value;
  }

  return value;
}

function buildInventoryRecordChangeDetails(params: {
  fromState: { resultStatus: string; comment: string | null };
  toState: { resultStatus: string; comment: string | null };
}): string {
  const changes: string[] = [];

  if (params.fromState.resultStatus !== params.toState.resultStatus) {
    changes.push(
      `статус результата: ${formatInventoryRecordValue('resultStatus', params.fromState.resultStatus)} → ${formatInventoryRecordValue('resultStatus', params.toState.resultStatus)}`,
    );
  }

  if (params.fromState.comment !== params.toState.comment) {
    changes.push(
      `комментарий: ${formatInventoryRecordValue('comment', params.fromState.comment)} → ${formatInventoryRecordValue('comment', params.toState.comment)}`,
    );
  }

  return changes.length > 0
    ? `Изменены поля записи: ${changes.join('; ')}`
    : 'Поля записи не изменились';
}

@Injectable()
export class InventoryRecordsService {
  constructor(
    @InjectRepository(InventoryRecord)
    private readonly recordsRepo: Repository<InventoryRecord>,
    @InjectRepository(Inventory)
    private readonly inventoriesRepo: Repository<Inventory>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(EquipmentAuditEvent)
    private readonly auditEventsRepo: Repository<EquipmentAuditEvent>,
  ) {}

  async create(dto: CreateInventoryRecordDto, user: User): Promise<InventoryRecord> {
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
      relations: ['status', 'location'],
    });
    if (!equipment) throw new NotFoundException('Оборудование не найдено');

    const record = this.recordsRepo.create({
      inventoryId: dto.inventoryId,
      equipmentId: dto.equipmentId,
      statusAtEventTime: equipment.status?.name ?? '',
      locationAtEventTime: equipment.location?.name ?? null,
      comment: dto.comment ?? null,
      resultStatus: 'FOUND',
    });

    try {
      const created = await this.recordsRepo.save(record);

      await this.auditEventsRepo.save(
        this.auditEventsRepo.create({
          equipmentId: equipment.id,
          actorUserId: user.id,
          actorName: user.fullName ?? user.email,
          action: 'INVENTORY_SCANNED',
          summary: 'Оборудование зафиксировано в инвентаризации',
          reason: dto.comment ?? null,
          toState: {
            resultStatus: created.resultStatus,
            statusAtEventTime: created.statusAtEventTime,
            locationAtEventTime: created.locationAtEventTime,
          },
          metadata: {
            inventoryId: created.inventoryId,
            inventoryRecordId: created.id,
          },
        }),
      );

      return created;
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

  async findByInventory(
    inventoryId: string,
    params: FindInventoryRecordsQueryDto,
  ) {
    const inventory = await this.inventoriesRepo.findOne({
      where: { id: inventoryId },
    });
    if (!inventory) throw new NotFoundException('Инвентаризация не найдена');

    const page = params.page < 1 ? 1 : params.page;
    const limit =
      params.limit < 1 ? 20 : params.limit > 500 ? 500 : params.limit;
    const offset = (page - 1) * limit;

    const qb = this.recordsRepo
      .createQueryBuilder('record')
      .withDeleted()
      .leftJoinAndSelect('record.equipment', 'equipment')
      .leftJoinAndSelect('equipment.status', 'equipmentStatus')
      .leftJoinAndSelect('equipment.type', 'equipmentType')
      .leftJoinAndSelect('equipment.location', 'location')
      .where('record.inventoryId = :inventoryId', { inventoryId })
      .orderBy('record.scannedAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (params.resultStatus !== undefined) {
      qb.andWhere('record.resultStatus = :resultStatus', {
        resultStatus: params.resultStatus,
      });
    }

    if (params.search && params.search.trim().length > 0) {
      qb.andWhere(
        '(equipment.name ILIKE :search OR equipment.inventoryNumber ILIKE :search)',
        {
          search: `%${params.search.trim()}%`,
        },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    const mappedItems = items.map((item) => ({
      ...item,
      equipment: item.equipment
        ? {
            id: item.equipment.id,
            inventoryNumber: item.equipment.inventoryNumber,
            name: item.equipment.name,
            serialNumber: item.equipment.serialNumber,
            status: item.equipment.status
              ? {
                  id: item.equipment.status.id,
                  name: item.equipment.status.name,
                }
              : null,
            type: item.equipment.type
              ? {
                  id: item.equipment.type.id,
                  name: item.equipment.type.name,
                }
              : null,
            location: item.equipment.location
              ? {
                  id: item.equipment.location.id,
                  name: item.equipment.location.name,
                }
              : null,
          }
        : null,
    }));

    return { items: mappedItems, total, page, limit };
  }

  async update(
    id: string,
    dto: UpdateInventoryRecordDto,
    user: User,
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

    const fromState = {
      resultStatus: record.resultStatus,
      comment: record.comment,
    };

    if (dto.comment !== undefined) {
      record.comment = dto.comment;
    }
    if (dto.resultStatus !== undefined) {
      record.resultStatus = dto.resultStatus;
    }

    const updated = await this.recordsRepo.save(record);

    const toState = {
      resultStatus: updated.resultStatus,
      comment: updated.comment,
    };

    if (
      fromState.resultStatus !== toState.resultStatus ||
      fromState.comment !== toState.comment
    ) {
      await this.auditEventsRepo.save(
        this.auditEventsRepo.create({
          equipmentId: updated.equipmentId,
          actorUserId: user.id,
          actorName: user.fullName ?? user.email,
          action: 'INVENTORY_RECORD_UPDATED',
          summary: 'Обновлена запись инвентаризации',
          details: buildInventoryRecordChangeDetails({
            fromState,
            toState,
          }),
          reason: dto.comment ?? null,
          fromState,
          toState,
          metadata: {
            inventoryId: updated.inventoryId,
            inventoryRecordId: updated.id,
          },
        }),
      );
    }

    return updated;
  }
}
