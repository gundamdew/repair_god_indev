import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { TransitionOrderDto } from './dto/transition-order.dto';
import { AdjustQuoteDto, ApproveAdjustmentDto, RejectAdjustmentDto } from './dto/adjust-quote.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new repair order (Draft or Diagnosed)' })
  @ApiResponse({ status: 201, description: 'Order created with initial audit event' })
  async createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders with optional status or workshop filters' })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  @ApiQuery({ name: 'workshopId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'List of repair orders' })
  async listOrders(
    @Query('status') status?: OrderStatus,
    @Query('workshopId') workshopId?: string,
  ) {
    return this.ordersService.listOrders({ status, workshopId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full order details with timeline, device, workshop, and invoices' })
  @ApiResponse({ status: 200, description: 'Order detail record' })
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perform deterministic FSM order status transition with audit logging',
  })
  @ApiResponse({ status: 200, description: 'State successfully transitioned' })
  async transitionStatus(
    @Param('id') id: string,
    @Body() dto: TransitionOrderDto,
  ) {
    return this.ordersService.transitionStatus(id, dto);
  }

  @Post(':id/adjust-quote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Technician discovers hidden fault and proposes adjusted quote (moves order to PriceAdjustmentNeeded)',
  })
  @ApiResponse({ status: 200, description: 'Price adjustment proposed and customer notification triggered' })
  async adjustQuote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AdjustQuoteDto,
  ) {
    return this.ordersService.proposePriceAdjustment(id, dto, user.id);
  }

  @Post(':id/approve-adjustment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Customer approves revised quote (moves order from PriceAdjustmentNeeded to InspectionConfirmed)',
  })
  @ApiResponse({ status: 200, description: 'Quote adjustment approved by customer' })
  async approveAdjustment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveAdjustmentDto,
  ) {
    return this.ordersService.approvePriceAdjustment(id, dto, user.id);
  }

  @Post(':id/reject-adjustment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Customer rejects revised quote (moves order from PriceAdjustmentNeeded to CancelledAndReturned)',
  })
  @ApiResponse({ status: 200, description: 'Quote rejected; order marked for device return' })
  async rejectAdjustment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectAdjustmentDto,
  ) {
    return this.ordersService.rejectPriceAdjustment(id, dto, user.id);
  }
}
