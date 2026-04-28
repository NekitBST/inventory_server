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

  async create(dto: CreateEquipmentDto): Promise<Equipment> {
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

    return this.saveWithUniqueConstraintHandling(equipment);
  }

  async update(id: string, dto: UpdateEquipmentDto): Promise<Equipment> {
    const equipment = await this.equipmentRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!equipment) throw new NotFoundException('Оборудование не найдено');

    if (
      dto.inventoryNumber !== undefined &&
      dto.inventoryNumber !== equipment.inventoryNumber
    ) {
      await this.ensureInventoryNumberUnique(dto.inventoryNumber);
      equipment.inventoryNumber = dto.inventoryNumber;
    }

    let statusAtEventTime: string | undefined;
    let locationAtEventTime: string | null | undefined;

    if (dto.name !== undefined) {
      equipment.name = dto.name;
    }

    if (
      dto.serialNumber !== undefined &&
      dto.serialNumber !== equipment.serialNumber
    ) {
      await this.ensureSerialNumberUnique(dto.serialNumber);
      equipment.serialNumber = dto.serialNumber;
    }

    if (dto.statusId !== undefined && dto.statusId !== equipment.statusId) {
      const status = await this.statusesRepo.findOne({
        where: { id: dto.statusId },
      });
      if (!status) throw new NotFoundException('Статус оборудования не найден');
      equipment.statusId = dto.statusId;
      statusAtEventTime = status.name;
    }

    if (dto.typeId !== undefined && dto.typeId !== equipment.typeId) {
      const type = await this.typesRepo.findOne({ where: { id: dto.typeId } });
      if (!type) throw new NotFoundException('Тип оборудования не найден');
      equipment.typeId = dto.typeId;
    }

    if (
      dto.locationId !== undefined &&
      dto.locationId !== equipment.locationId
    ) {
      if (dto.locationId === null) {
        equipment.locationId = null;
        locationAtEventTime = null;
      } else {
        const location = await this.locationsRepo.findOne({
          where: { id: dto.locationId },
        });
        if (!location) throw new NotFoundException('Локация не найдена');
        equipment.locationId = dto.locationId;
        locationAtEventTime = location.name;
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

  async remove(id: string): Promise<void> {
    const equipment = await this.equipmentRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!equipment) {
      throw new NotFoundException('Оборудование не найдено');
    }

    await this.equipmentRepo.softDelete(id);
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
