import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bonjour, { Service } from 'bonjour-service';
import { networkInterfaces } from 'node:os';
import { DiscoveryInfoResponseDto } from './dto/discovery-info-response.dto';

@Injectable()
export class DiscoveryService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(DiscoveryService.name);
  private readonly bonjour = new Bonjour();
  private service?: Service;

  private readonly enabled: boolean;
  private readonly serviceName: string;
  private readonly serviceType: string;
  private readonly servicePath: string;
  private readonly publicBaseUrl?: string;
  private readonly port: number;
  private readonly host: string;

  constructor(private readonly config: ConfigService) {
    this.enabled = this.config.get<boolean>('discovery.enabled') ?? true;
    this.serviceName =
      this.config.get<string>('discovery.serviceName') ?? 'Inventory Server';
    this.serviceType =
      this.config.get<string>('discovery.serviceType') ?? 'inventory';
    this.servicePath =
      this.config.get<string>('discovery.servicePath') ?? '/discovery/info';
    this.publicBaseUrl =
      this.config.get<string>('discovery.publicBaseUrl')?.trim() || undefined;
    this.port = this.config.get<number>('port') ?? 3000;
    this.host = this.config.get<string>('host') ?? '0.0.0.0';
  }

  onModuleInit() {
    if (!this.enabled) {
      this.logger.log('LAN discovery disabled');
      return;
    }

    this.service = this.bonjour.publish({
      name: this.serviceName,
      type: this.serviceType,
      protocol: 'tcp',
      port: this.port,
      txt: {
        path: this.servicePath,
        protocol: 'http',
      },
    });

    this.logger.log(
      `LAN discovery published as ${this.serviceName} on _${this.serviceType}._tcp`,
    );
  }

  onApplicationShutdown() {
    this.service?.stop?.();
    this.bonjour.destroy();
  }

  getInfo(): DiscoveryInfoResponseDto {
    const addresses = this.getLocalAddresses();
    const baseUrls = this.getBaseUrls(addresses);
    const resolvedBaseUrl = this.publicBaseUrl ?? baseUrls[0] ?? null;

    return {
      serviceName: this.serviceName,
      serviceType: this.serviceType,
      protocol: 'http',
      port: this.port,
      path: this.servicePath,
      host: this.host,
      publicBaseUrl: this.publicBaseUrl ?? null,
      addresses,
      baseUrls,
      authUrl: resolvedBaseUrl ? `${resolvedBaseUrl}/auth/login` : null,
      refreshUrl: resolvedBaseUrl ? `${resolvedBaseUrl}/auth/refresh` : null,
      swaggerUrl: resolvedBaseUrl ? `${resolvedBaseUrl}/swagger` : null,
    };
  }

  private getBaseUrls(addresses: string[]) {
    if (this.publicBaseUrl) {
      return [this.publicBaseUrl];
    }

    return addresses.map((address) => `http://${address}:${this.port}`);
  }

  private getLocalAddresses() {
    const interfaces = networkInterfaces();
    const addresses = new Set<string>();

    for (const entries of Object.values(interfaces)) {
      for (const entry of entries ?? []) {
        if (entry.family === 'IPv4' && !entry.internal) {
          addresses.add(entry.address);
        }
      }
    }

    return Array.from(addresses);
  }
}