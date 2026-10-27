import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current customer profile with device and order counts' })
  @ApiResponse({ status: 200, description: 'Customer profile details' })
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update customer personal profile information' })
  @ApiResponse({ status: 200, description: 'Updated customer profile' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateProfile(user.id, dto);
  }

  @Get('me/orders')
  @ApiOperation({ summary: 'Get active and historical orders for current customer' })
  @ApiResponse({ status: 200, description: 'List of customer orders' })
  async getOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.getCustomerOrders(user.id);
  }
}
