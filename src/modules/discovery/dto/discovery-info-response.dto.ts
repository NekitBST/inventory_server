import { ApiProperty } from '@nestjs/swagger';

export class DiscoveryInfoResponseDto {
  @ApiProperty({ example: 'Inventory Server' })
  serviceName: string;

  @ApiProperty({ example: 'inventory' })
  serviceType: string;

  @ApiProperty({ example: 'http' })
  protocol: string;

  @ApiProperty({ example: 3000 })
  port: number;

  @ApiProperty({ example: '/discovery/info' })
  path: string;

  @ApiProperty({ example: '0.0.0.0' })
  host: string;

  @ApiProperty({ example: 'http://inventory.local:3000', nullable: true })
  publicBaseUrl: string | null;

  @ApiProperty({ type: [String], example: ['192.168.1.12', '10.0.0.7'] })
  addresses: string[];

  @ApiProperty({
    type: [String],
    example: [
      'http://192.168.1.12:3000',
      'http://10.0.0.7:3000',
    ],
  })
  baseUrls: string[];

  @ApiProperty({ example: 'http://192.168.1.12:3000/auth/login', nullable: true })
  authUrl: string | null;

  @ApiProperty({
    example: 'http://192.168.1.12:3000/auth/refresh',
    nullable: true,
  })
  refreshUrl: string | null;

  @ApiProperty({ example: 'http://192.168.1.12:3000/swagger', nullable: true })
  swaggerUrl: string | null;
}