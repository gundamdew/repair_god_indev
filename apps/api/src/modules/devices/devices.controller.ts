import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Devices')
@Controller('api/v1/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Get device catalog taxonomy (categories, brands, popular models)' })
  @ApiResponse({ status: 200, description: 'Catalog taxonomy list' })
  getCatalog() {
    return this.devicesService.getCatalog();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all devices owned by current customer' })
  @ApiResponse({ status: 200, description: 'Customer device list' })
  async getMyDevices(@CurrentUser() user: AuthenticatedUser) {
    return this.devicesService.getUserDevices(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new device into customer account' })
  @ApiResponse({ status: 201, description: 'Created device details' })
  async createDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDeviceDto,
  ) {
    return this.devicesService.createDevice(user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get device details by ID' })
  @ApiResponse({ status: 200, description: 'Device details' })
  async getDeviceById(@Param('id') id: string) {
    return this.devicesService.getDeviceById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete or unlink device from customer account' })
  @ApiResponse({ status: 200, description: 'Deletion status' })
  async deleteDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.devicesService.deleteDevice(id, user.id);
  }
}
