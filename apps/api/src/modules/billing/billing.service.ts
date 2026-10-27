import { Injectable, Inject, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { EscrowStatus, InvoiceType } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import {
  IPaymentGatewayPort,
  PAYMENT_GATEWAY_PORT,
} from './ports/payment-gateway.port';
import { BlikAuthorizeDto } from './dto/blik-authorize.dto';
import { EscrowReleaseDto, EscrowRefundDto } from './dto/escrow-release.dto';
import { MoneyUtil } from '../../common/money/money.util';
import { OrderFsmService } from '../../common/fsm/order-fsm.service';

export interface InvoiceRecord {
  id: string;
  orderId: string;
  invoiceNumber: string;
  amountGrosze: number;
  vatGrosze: number;
  type: InvoiceType;
  createdAt: Date;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly memoryInvoices = new Map<string, InvoiceRecord>();

  constructor(
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: IPaymentGatewayPort,
    private readonly prisma: PrismaService,
    private readonly fsmService: OrderFsmService,
  ) {}

  async authorizeBlik(dto: BlikAuthorizeDto) {
    MoneyUtil.assertValidGrosze(dto.amountGrosze, 'amountGrosze');

    const authResult = await this.paymentGateway.authorizeBlik({
      orderId: dto.orderId,
      blikCode: dto.blikCode,
      amountGrosze: dto.amountGrosze,
      description: dto.description,
    });

    const holdResult = await this.paymentGateway.holdEscrow(dto.orderId, dto.amountGrosze);

    if (this.prisma.isConnected) {
      try {
        const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
        if (order) {
          // If in Draft or Diagnosed, advance to OrderConfirmed
          const targetStatus = 'OrderConfirmed';
          if (this.fsmService.canTransition(order.status, targetStatus)) {
            await this.prisma.order.update({
              where: { id: order.id },
              data: {
                status: targetStatus,
                escrowStatus: EscrowStatus.HELD,
                paymentMethod: 'BLIK',
                totalGrosze: dto.amountGrosze,
              },
            });

            await this.prisma.orderStatusEvent.create({
              data: {
                orderId: order.id,
                fromStatus: order.status,
                toStatus: targetStatus,
                actor: 'CUSTOMER_PAYMENT',
                metadata: {
                  paymentMethod: 'BLIK',
                  amountGrosze: dto.amountGrosze,
                  escrowStatus: 'HELD',
                  transactionId: authResult.transactionId,
                },
              },
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Could not update order payment state in DB: ${err}`);
      }
    }

    return {
      success: true,
      auth: authResult,
      escrow: holdResult,
      formattedAmount: MoneyUtil.formatPln(dto.amountGrosze),
    };
  }

  async releaseEscrow(dto: EscrowReleaseDto) {
    let amountGrosze = dto.amountGrosze;

    if (!amountGrosze && this.prisma.isConnected) {
      const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
      if (order) {
        amountGrosze = order.totalGrosze;
      }
    }
    amountGrosze = amountGrosze || 10000; // Fallback 100 PLN in grosz

    MoneyUtil.assertValidGrosze(amountGrosze, 'amountGrosze');

    const releaseResult = await this.paymentGateway.releaseEscrow(dto.orderId, amountGrosze);

    // Generate Invoice with 23% VAT calculated in integer grosz
    const vatGrosze = MoneyUtil.calculateVatFromGross(amountGrosze, 23);
    const invoiceNumber = `FV/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;

    const invoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      orderId: dto.orderId,
      invoiceNumber,
      amountGrosze,
      vatGrosze,
      type: InvoiceType.VAT_STANDARD,
      createdAt: new Date(),
    };

    if (this.prisma.isConnected) {
      try {
        await this.prisma.invoice.create({
          data: {
            id: invoice.id,
            orderId: invoice.orderId,
            invoiceNumber: invoice.invoiceNumber,
            amountGrosze: invoice.amountGrosze,
            vatGrosze: invoice.vatGrosze,
            type: invoice.type,
          },
        });

        const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
        if (order) {
          // Advance FSM: Delivered -> FundsReleased -> Closed
          if (this.fsmService.canTransition(order.status, 'FundsReleased')) {
            await this.prisma.order.update({
              where: { id: order.id },
              data: {
                status: 'Closed',
                escrowStatus: EscrowStatus.RELEASED,
              },
            });

            await this.prisma.orderStatusEvent.create({
              data: {
                orderId: order.id,
                fromStatus: order.status,
                toStatus: 'FundsReleased',
                actor: 'SYSTEM_ESCROW',
                metadata: { amountGrosze, invoiceNumber },
              },
            });

            await this.prisma.orderStatusEvent.create({
              data: {
                orderId: order.id,
                fromStatus: 'FundsReleased',
                toStatus: 'Closed',
                actor: 'SYSTEM_ESCROW',
                metadata: { settled: true },
              },
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Could not persist invoice in DB: ${err}`);
      }
    }

    this.memoryInvoices.set(invoice.id, invoice);
    this.memoryInvoices.set(dto.orderId, invoice);

    return {
      release: releaseResult,
      invoice: {
        ...invoice,
        amountFormatted: MoneyUtil.formatPln(invoice.amountGrosze),
        vatFormatted: MoneyUtil.formatPln(invoice.vatGrosze),
        netFormatted: MoneyUtil.formatPln(invoice.amountGrosze - invoice.vatGrosze),
      },
    };
  }

  async refundEscrow(dto: EscrowRefundDto) {
    MoneyUtil.assertValidGrosze(dto.refundGrosze, 'refundGrosze');
    const result = await this.paymentGateway.refundEscrow(dto.orderId, dto.refundGrosze);

    if (this.prisma.isConnected) {
      try {
        await this.prisma.order.update({
          where: { id: dto.orderId },
          data: { escrowStatus: EscrowStatus.REFUNDED },
        });
      } catch (err) {
        this.logger.warn(`Failed updating escrowStatus to REFUNDED: ${err}`);
      }
    }

    return {
      ...result,
      refundFormatted: MoneyUtil.formatPln(dto.refundGrosze),
    };
  }

  async getInvoicesForOrder(orderId: string): Promise<InvoiceRecord[]> {
    if (this.prisma.isConnected) {
      try {
        return await this.prisma.invoice.findMany({ where: { orderId } });
      } catch {
        // Fallback
      }
    }

    const inv = this.memoryInvoices.get(orderId);
    return inv ? [inv] : [];
  }
}
