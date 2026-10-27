import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { InPostWebhookDto } from './dto/inpost-webhook.dto';

@ApiTags('Logistics')
@Controller('api/v1/logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post('shipments')
  @ApiOperation({
    summary: 'Generate InPost ShipX courier / Paczkomat shipping label and tracking number',
  })
  @ApiResponse({ status: 201, description: 'Shipment created with tracking code and PDF label URL' })
  async createShipment(@Body() dto: CreateShipmentDto) {
    return this.logisticsService.createShipment({
      orderId: dto.orderId,
      senderLockerCode: dto.senderLockerCode,
      receiverLockerCode: dto.receiverLockerCode,
      senderPhone: dto.senderPhone || '+48500100200',
      receiverPhone: dto.receiverPhone || '+48221002030',
      parcelSize: dto.parcelSize,
    });
  }

  @Get('shipments/:id/tracking')
  @ApiOperation({ summary: 'Get live tracking checkpoints for shipment or tracking number' })
  @ApiResponse({ status: 200, description: 'List of tracking events and checkpoints' })
  async getTracking(@Param('id') id: string) {
    return this.logisticsService.getTracking(id);
  }

  @Post('webhooks/inpost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle incoming InPost ShipX webhook event (courier pickup, delivery)' })
  @ApiResponse({ status: 200, description: 'Webhook acknowledged' })
  async handleWebhook(@Body() dto: InPostWebhookDto) {
    return this.logisticsService.handleInPostWebhook(dto);
  }

  @Get('lockers/search')
  @ApiOperation({ summary: 'Search InPost Paczkomaty machines by city, postal code, or machine ID' })
  @ApiResponse({ status: 200, description: 'Matching InPost Paczkomat lockers' })
  async searchLockers(@Query('q') q: string) {
    return this.logisticsService.searchLockers(q || '');
  }
}
