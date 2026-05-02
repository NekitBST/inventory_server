import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, QueryFailedError, Repository } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { FindEquipmentQueryDto } from './dto/find-equipment-query.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Location } from '../locations/entities/location.entity';
import { EquipmentStatus } from '../equipment-statuses/entities/equipment-status.entity';
import { EquipmentType } from '../equipment-types/entities/equipment-type.entity';
import { Inventory } from '../inventories/entities/inventory.entity';
import { InventoryRecord } from '../inventory-records/entities/inventory-record.entity';
import {
  EquipmentAuditAction,
  EquipmentAuditEvent,
} from './entities/equipment-audit-event.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(Location)
    private readonly locationsRepo: Repository<Location>,
    @InjectRepository(EquipmentStatus)
    private readonly statusesRepo: Repository<EquipmentStatus>,
    @InjectRepository(EquipmentType)
    private readonly typesRepo: Repository<EquipmentType>,
    @InjectRepository(Inventory)
    private readonly inventoriesRepo: Repository<Inventory>,
    @InjectRepository(InventoryRecord)
    private readonly inventoryRecordsRepo: Repository<InventoryRecord>,
    @InjectRepository(EquipmentAuditEvent)
    private readonly auditEventsRepo: Repository<EquipmentAuditEvent>,
  ) {}

  async findAll(params: FindEquipmentQueryDto) {
    const page = params.page < 1 ? 1 : params.page;
    const limit =
      params.limit < 1 ? 20 : params.limit > 500 ? 500 : params.limit;
    const offset = (page - 1) * limit;

    const qb = this.equipmentRepo
      .createQueryBuilder('equipment')
      .leftJoinAndSelect('equipment.location', 'location')
      .leftJoinAndSelect('equipment.status', 'status')
      .leftJoinAndSelect('equipment.type', 'type')
      .where('equipment.deletedAt IS NULL')
      .orderBy('equipment.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (params.statusId !== undefined) {
      qb.andWhere('equipment.statusId = :statusId', {
        statusId: params.statusId,
      });
    }

    if (params.typeId !== undefined) {
      qb.andWhere('equipment.typeId = :typeId', { typeId: params.typeId });
    }

    if (params.locationId !== undefined) {
      qb.andWhere('equipment.locationId = :locationId', {
        locationId: params.locationId,
      });
    }

    if (params.search && params.search.trim().length > 0) {
      const searchValue = `%${params.search.trim()}%`;
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('equipment.inventoryNumber ILIKE :search', {
              search: searchValue,
            })
            .orWhere('equipment.name ILIKE :search', { search: searchValue })
            .orWhere('equipment.serialNumber ILIKE :search', {
              search: searchValue,
            });
        }),
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findById(id: string): Promise<Equipment> {
    const equipment = await this.equipmentRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['location', 'status', 'type'],
    });

    if (!equipment) throw new NotFoundException('Оборудование не найдено');
    return equipment;
  }

  async findByInventoryNumber(inventoryNumber: string): Promise<Equipment> {
    const normalizedInventoryNumber = inventoryNumber.trim();
    const equipment = await this.equipmentRepo.findOne({
      where: {
        inventoryNumber: normalizedInventoryNumber,
        deletedAt: IsNull(),
      },
      relations: ['location', 'status', 'type'],
    });

    if (!equipment) throw new NotFoundException('Оборудование не найдено');
    return equipment;
  }

  async create(dto: CreateEquipmentDto, user: User): Promise<Equipment> {
    await this.ensureInventoryNumberUnique(dto.inventoryNumber);
    if (dto.serialNumber) {
      await this.ensureSerialNumberUnique(dto.serialNumber);
    }

    await this.ensureReferencesExist(dto.statusId, dto.typeId, dto.locationId);

    const equipment = this.equipmentRepo.create({
      inventoryNumber: dto.inventoryNumber,
      name: dto.name,
      serialNumber: dto.serialNumber ?? null,
      locationId: dto.locationId ?? null,
      statusId: dto.statusId,
      typeId: dto.typeId,
    });

    const createdEquipment =
      await this.saveWithUniqueConstraintHandling(equipment);

    await this.logAuditEvent({
      equipmentId: createdEquipment.id,
      action: 'CREATED',
      summary: 'Оборудование добавлено в базу',
      actor: user,
      toState: {
        inventoryNumber: createdEquipment.inventoryNumber,
        name: createdEquipment.name,
        serialNumber: createdEquipment.serialNumber,
        statusId: createdEquipment.statusId,
        typeId: createdEquipment.typeId,
        locationId: createdEquipment.locationId,
      },
    });

    return createdEquipment;
  }

  async update(
    id: string,
    dto: UpdateEquipmentDto,
    user: User,
  ): Promise<Equipment> {
    const equipment = await this.equipmentRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['status', 'type', 'location'],
    });
    if (!equipment) throw new NotFoundException('Оборудование не найдено');

    const fromState: Record<string, unknown> = {};
    const toState: Record<string, unknown> = {};
    let auditAction: EquipmentAuditAction = 'UPDATED';
    let auditSummary = 'Обновлены данные оборудования';

    if (
      dto.inventoryNumber !== undefined &&
      dto.inventoryNumber !== equipment.inventoryNumber
    ) {
      await this.ensureInventoryNumberUnique(dto.inventoryNumber);
      fromState.inventoryNumber = equipment.inventoryNumber;
      toState.inventoryNumber = dto.inventoryNumber;
      equipment.inventoryNumber = dto.inventoryNumber;
    }

    let statusAtEventTime: string | undefined;
    let locationAtEventTime: string | null | undefined;

    if (dto.name !== undefined) {
      if (dto.name !== equipment.name) {
        fromState.name = equipment.name;
        toState.name = dto.name;
      }
      equipment.name = dto.name;
    }

    if (dto.serialNumber !== undefined) {
      if (
        dto.serialNumber !== null &&
        dto.serialNumber !== equipment.serialNumber
      ) {
        await this.ensureSerialNumberUnique(dto.serialNumber);
      }

      if (dto.serialNumber !== equipment.serialNumber) {
        fromState.serialNumber = equipment.serialNumber;
        toState.serialNumber = dto.serialNumber;
        equipment.serialNumber = dto.serialNumber;
      }
    }

    if (dto.statusId !== undefined && dto.statusId !== equipment.statusId) {
      const status = await this.statusesRepo.findOne({
        where: { id: dto.statusId },
      });
      if (!status) throw new NotFoundException('Статус оборудования не найден');
      fromState.status = equipment.status?.name ?? null;
      toState.status = status.name;
      equipment.statusId = dto.statusId;
      equipment.status = status;
      statusAtEventTime = status.name;
      auditAction = 'STATUS_CHANGED';
      auditSummary = 'Изменён статус оборудования';
    }

    if (dto.typeId !== undefined && dto.typeId !== equipment.typeId) {
      const type = await this.typesRepo.findOne({ where: { id: dto.typeId } });
      if (!type) throw new NotFoundException('Тип оборудования не найден');
      fromState.type = equipment.type?.name ?? null;
      toState.type = type.name;
      equipment.typeId = dto.typeId;
      equipment.type = type;
      if (auditAction !== 'STATUS_CHANGED') {
        auditAction = 'TYPE_CHANGED';
        auditSummary = 'Изменён тип оборудования';
      }
    }

    if (
      dto.locationId !== undefined &&
      dto.locationId !== equipment.locationId
    ) {
      fromState.location = equipment.location?.name ?? null;
      if (dto.locationId === null) {
        equipment.locationId = null;
        equipment.location = null;
        toState.location = null;
        locationAtEventTime = null;
      } else {
        const location = await this.locationsRepo.findOne({
          where: { id: dto.locationId },
        });
        if (!location) throw new NotFoundException('Локация не найдена');
        equipment.locationId = dto.locationId;
        equipment.location = location;
        toState.location = location.name;
        locationAtEventTime = location.name;
      }

      if (auditAction !== 'STATUS_CHANGED') {
        auditAction = 'LOCATION_CHANGED';
        auditSummary = 'Изменено расположение оборудования';
      }
    }

    const updatedEquipment =
      await this.saveWithUniqueConstraintHandling(equipment);

    if (statusAtEventTime !== undefined || locationAtEventTime !== undefined) {
      await this.syncOpenInventoryRecordsState(
        equipment.id,
        statusAtEventTime,
        locationAtEventTime,
      );
    }

    if (Object.keys(toState).length > 0) {
      const details = this.buildAuditDetails(fromState, toState);
      await this.logAuditEvent({
        equipmentId: equipment.id,
        action: auditAction,
        summary: auditSummary,
        actor: user,
        reason: dto.changeReason ?? null,
        fromState,
        toState,
        details,
      });
    }

    return updatedEquipment;
  }

  private async syncOpenInventoryRecordsState(
    equipmentId: string,
    statusAtEventTime?: string,
    locationAtEventTime?: string | null,
  ): Promise<void> {
    const openInventories = await this.inventoriesRepo.find({
      where: { status: 'OPEN' },
      select: ['id'],
    });

    if (!openInventories.length) return;

    const openInventoryIds = openInventories.map((inventory) => inventory.id);
    const payload: Partial<InventoryRecord> = {};

    if (statusAtEventTime !== undefined) {
      payload.statusAtEventTime = statusAtEventTime;
    }

    if (locationAtEventTime !== undefined) {
      payload.locationAtEventTime = locationAtEventTime;
    }

    if (!Object.keys(payload).length) return;

    await this.inventoryRecordsRepo
      .createQueryBuilder()
      .update(InventoryRecord)
      .set(payload)
      .where('equipment_id = :equipmentId', { equipmentId })
      .andWhere('inventory_id IN (:...openInventoryIds)', { openInventoryIds })
      .execute();
  }

  async remove(id: string, user: User): Promise<void> {
    const equipment = await this.equipmentRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!equipment) {
      throw new NotFoundException('Оборудование не найдено');
    }

    await this.logAuditEvent({
      equipmentId: equipment.id,
      action: 'DELETED',
      summary: 'Оборудование удалено из активного списка',
      actor: user,
      fromState: {
        inventoryNumber: equipment.inventoryNumber,
        name: equipment.name,
      },
    });

    await this.equipmentRepo.softDelete(id);
  }

  async getTimeline(id: string): Promise<EquipmentAuditEvent[]> {
    const equipment = await this.equipmentRepo.findOne({
      where: { id, deletedAt: IsNull() },
      select: ['id'],
    });

    if (!equipment) {
      throw new NotFoundException('Оборудование не найдено');
    }

    return this.auditEventsRepo.find({
      where: { equipmentId: id },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  private buildAuditDetails(
    fromState: Record<string, unknown>,
    toState: Record<string, unknown>,
  ): string | null {
    const changes: string[] = [];

    const fieldLabels: Record<string, string> = {
      status: 'статус',
      statusId: 'статус',
      name: 'название',
      serialNumber: 'серийный номер',
      type: 'тип оборудования',
      typeId: 'тип оборудования',
      location: 'расположение',
      locationId: 'расположение',
      inventoryNumber: 'инвентарный номер',
    };

    for (const key of Object.keys(toState)) {
      const from = fromState[key];
      const to = toState[key];
      if (from !== to) {
        const label = fieldLabels[key] || key;
        const fromVal = from === null ? 'пусто' : String(from);
        const toVal = to === null ? 'пусто' : String(to);
        changes.push(`${label}: ${fromVal} → ${toVal}`);
      }
    }

    return changes.length ? `Изменены поля: ${changes.join(', ')}` : null;
  }

  private async logAuditEvent(params: {
    equipmentId: string;
    action: EquipmentAuditAction;
    summary: string;
    actor?: User;
    reason?: string | null;
    details?: string | null;
    fromState?: Record<string, unknown> | null;
    toState?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    const event = this.auditEventsRepo.create({
      equipmentId: params.equipmentId,
      action: params.action,
      summary: params.summary,
      actorUserId: params.actor?.id ?? null,
      actorName: params.actor?.fullName ?? params.actor?.email ?? null,
      reason: params.reason ?? null,
      details: params.details ?? null,
      fromState: params.fromState ?? null,
      toState: params.toState ?? null,
      metadata: params.metadata ?? null,
    });

    await this.auditEventsRepo.save(event);
  }

  private async ensureReferencesExist(
    statusId: number,
    typeId: number,
    locationId?: number | null,
  ): Promise<void> {
    const status = await this.statusesRepo.findOne({ where: { id: statusId } });
    if (!status) throw new NotFoundException('Статус оборудования не найден');

    const type = await this.typesRepo.findOne({ where: { id: typeId } });
    if (!type) throw new NotFoundException('Тип оборудования не найден');

    if (locationId !== undefined && locationId !== null) {
      const location = await this.locationsRepo.findOne({
        where: { id: locationId },
      });
      if (!location) throw new NotFoundException('Локация не найдена');
    }
  }

  private async ensureInventoryNumberUnique(value: string): Promise<void> {
    const existing = await this.equipmentRepo.findOne({
      where: { inventoryNumber: value, deletedAt: IsNull() },
    });
    if (existing) {
      throw new ConflictException(
        'Оборудование с таким инвентарным номером уже существует',
      );
    }
  }

  private async ensureSerialNumberUnique(value: string): Promise<void> {
    const existing = await this.equipmentRepo.findOne({
      where: { serialNumber: value, deletedAt: IsNull() },
    });
    if (existing) {
      throw new ConflictException(
        'Оборудование с таким серийным номером уже существует',
      );
    }
  }

  private async saveWithUniqueConstraintHandling(
    equipment: Equipment,
  ): Promise<Equipment> {
    try {
      return await this.equipmentRepo.save(equipment);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new ConflictException(
          'Нарушение уникальности данных оборудования',
        );
      }
      throw error;
    }
  }
}
