import { Controller, Get, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { DiscoveryService } from './discovery.service';
import { DiscoveryInfoResponseDto } from './dto/discovery-info-response.dto';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('info')
  @ApiOperation({
    summary: 'Public LAN discovery metadata for connected clients',
  })
  @ApiOkResponse({ type: DiscoveryInfoResponseDto })
  getInfo(@Req() request: Request): DiscoveryInfoResponseDto {
    return this.discoveryService.getInfo(request);
  }
}