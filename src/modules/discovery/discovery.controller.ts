import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  getInfo(): DiscoveryInfoResponseDto {
    return this.discoveryService.getInfo();
  }
}