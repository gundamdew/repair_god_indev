import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { BlikAuthorizeDto } from './dto/blik-authorize.dto';
import { EscrowReleaseDto, EscrowRefundDto } from './dto/escrow-release.dto';

@ApiTags('Billing')
@Controller('api/v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('blik/authorize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authorize payment using 6-digit BLIK code and place funds into Escrow hold (all in grosze)',
  })
  @ApiResponse({ status: 200, description: 'BLIK authorized, funds placed in escrow hold' })
  async authorizeBlik(@Body() dto: BlikAuthorizeDto) {
    return this.billingService.authorizeBlik(dto);
  }

  @Post('escrow/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release escrow funds to workshop after repair completion and generate VAT invoice',
  })
  @ApiResponse({ status: 200, description: 'Funds released, invoice created, order completed' })
  async releaseEscrow(@Body() dto: EscrowReleaseDto) {
    return this.billingService.releaseEscrow(dto);
  }

  @Post('escrow/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refund held escrow funds to customer in case of order cancellation / rejected quote',
  })
  @ApiResponse({ status: 200, description: 'Escrow refunded' })
  async refundEscrow(@Body() dto: EscrowRefundDto) {
    return this.billingService.refundEscrow(dto);
  }

  @Get('invoices/:orderId')
  @ApiOperation({ summary: 'Get generated VAT invoices for a given order' })
  @ApiResponse({ status: 200, description: 'List of invoices for order' })
  async getInvoices(@Param('orderId') orderId: string) {
    return this.billingService.getInvoicesForOrder(orderId);
  }
}
