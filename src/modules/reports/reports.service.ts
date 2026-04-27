import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Inventory } from '../inventories/entities/inventory.entity';
import { InventoryRecord } from '../inventory-records/entities/inventory-record.entity';
import { ExportEquipmentReportQueryDto } from './dto/export-equipment-report-query.dto';
import { ExportInventoryRecordsReportQueryDto } from './dto/export-inventory-records-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(Inventory)
    private readonly inventoriesRepo: Repository<Inventory>,
    @InjectRepository(InventoryRecord)
    private readonly recordsRepo: Repository<InventoryRecord>,
  ) {}

  async buildEquipmentCsv(
    query: ExportEquipmentReportQueryDto,
  ): Promise<string> {
    const qb = this.equipmentRepo
      .createQueryBuilder('equipment')
      .leftJoinAndSelect('equipment.status', 'status')
      .leftJoinAndSelect('equipment.type', 'type')
      .leftJoinAndSelect('equipment.location', 'location')
      .where('equipment.deletedAt IS NULL')
      .orderBy('equipment.createdAt', 'DESC');

    if (query.statusId !== undefined) {
      qb.andWhere('equipment.statusId = :statusId', {
        statusId: query.statusId,
      });
    }

    if (query.typeId !== undefined) {
      qb.andWhere('equipment.typeId = :typeId', { typeId: query.typeId });
    }

    if (query.locationId !== undefined) {
      qb.andWhere('equipment.locationId = :locationId', {
        locationId: query.locationId,
      });
    }

    if (query.search && query.search.trim().length > 0) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('equipment.inventoryNumber ILIKE :search', { search })
            .orWhere('equipment.name ILIKE :search', { search })
            .orWhere('equipment.serialNumber ILIKE :search', { search });
        }),
      );
    }

    const items = await qb.getMany();

    const rows: Array<Array<string | number | null>> = [
      [
        'Инвентарный номер',
        'Наименование',
        'Серийный номер',
        'Статус',
        'Тип',
        'Локация',
      ],
      ...items.map((item) => [
        item.inventoryNumber,
        item.name,
        item.serialNumber,
        item.status?.name ?? '',
        item.type?.name ?? '',
        item.location?.name ?? '',
      ]),
    ];

    return this.toCsv(rows);
  }

  async buildInventoryRecordsCsv(
    inventoryId: string,
    query: ExportInventoryRecordsReportQueryDto,
  ): Promise<string> {
    const inventory = await this.inventoriesRepo.findOne({
      where: { id: inventoryId },
      relations: ['createdByUser'],
    });

    if (!inventory) {
      throw new NotFoundException('Инвентаризация не найдена');
    }

    if (inventory.status !== 'CLOSED') {
      throw new ConflictException(
        'Отчет можно выгрузить только по завершенной инвентаризации',
      );
    }

    const qb = this.recordsRepo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.equipment', 'equipment')
      .leftJoinAndSelect('equipment.status', 'status')
      .leftJoinAndSelect('equipment.type', 'type')
      .leftJoinAndSelect('equipment.location', 'location')
      .where('record.inventoryId = :inventoryId', { inventoryId })
      .orderBy('record.scannedAt', 'DESC');

    if (query.resultStatus !== undefined) {
      qb.andWhere('record.resultStatus = :resultStatus', {
        resultStatus: query.resultStatus,
      });
    }

    if (query.search && query.search.trim().length > 0) {
      qb.andWhere(
        '(equipment.inventoryNumber ILIKE :search OR equipment.name ILIKE :search)',
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    const records = await qb.getMany();

    const rows: Array<Array<string | number | null>> = [
      ['Отчет по инвентаризации'],
      ['ID инвентаризации', inventory.id],
      ['Статус', this.toInventoryStatusLabel(inventory.status)],
      ['Начало', this.formatDate(inventory.startedAt)],
      ['Окончание', this.formatDate(inventory.finishedAt)],
      ['Сотрудник', inventory.createdByUser?.fullName ?? ''],
      ['Email сотрудника', inventory.createdByUser?.email ?? ''],
      [],
      [
        'Инвентарный номер',
        'Наименование',
        'Серийный номер',
        'Статус оборудования',
        'Тип',
        'Локация',
        'Результат',
        'Комментарий',
        'Сканировано',
      ],
      ...records.map((record) => [
        record.equipment?.inventoryNumber ?? '',
        record.equipment?.name ?? '',
        record.equipment?.serialNumber ?? '',
        record.equipment?.status?.name ?? '',
        record.equipment?.type?.name ?? '',
        record.equipment?.location?.name ?? '',
        this.toResultStatusLabel(record.resultStatus),
        record.comment ?? '',
        this.formatDate(record.scannedAt),
      ]),
    ];

    return this.toCsv(rows);
  }

  private formatDate(value: Date | null | undefined): string {
    if (!value) return '';
    return value.toISOString().replace('T', ' ').slice(0, 19);
  }

  private toResultStatusLabel(value: 'FOUND' | 'DAMAGED'): string {
    return value === 'FOUND' ? 'Найдено' : 'Повреждено';
  }

  private toInventoryStatusLabel(value: 'OPEN' | 'CLOSED'): string {
    return value === 'OPEN' ? 'Открытая' : 'Закрытая';
  }

  private toCsv(rows: Array<Array<string | number | null>>): string {
    const escapeCell = (value: string | number | null) => {
      const normalized =
        value === null || value === undefined ? '' : String(value);
      return `"${normalized.replace(/"/g, '""')}"`;
    };

    const content = rows.map((row) => row.map(escapeCell).join(',')).join('\n');
    return `\uFEFF${content}`;
  }
}
