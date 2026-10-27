import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  BlikAuthorizeInput,
  EscrowHoldResult,
  EscrowRefundResult,
  EscrowReleaseResult,
  IPaymentGatewayPort,
  PaymentAuthResult,
} from '../ports/payment-gateway.port';
import { MoneyUtil } from '../../../common/money/money.util';

@Injectable()
export class MockBlikPaymentAdapter implements IPaymentGatewayPort {
  private readonly logger = new Logger(MockBlikPaymentAdapter.name);

  async authorizeBlik(input: BlikAuthorizeInput): Promise<PaymentAuthResult> {
    MoneyUtil.assertValidGrosze(input.amountGrosze, 'amountGrosze');

    if (!/^[0-9]{6}$/.test(input.blikCode)) {
      throw new BadRequestException('Kod BLIK musi składać się z 6 cyfr');
    }

    const transactionId = `blik-tx-${Date.now()}`;
    this.logger.log(
      `[BLIK Mock Gateway] Authorization successful: orderId=${input.orderId}, code=${input.blikCode}, amount=${MoneyUtil.formatPln(
        input.amountGrosze,
      )} (${input.amountGrosze} groszy)`,
    );

    return {
      transactionId,
      orderId: input.orderId,
      amountGrosze: input.amountGrosze,
      status: 'AUTHORIZED',
      paymentMethod: 'BLIK',
      authorizedAt: new Date(),
    };
  }

  async holdEscrow(orderId: string, amountGrosze: number): Promise<EscrowHoldResult> {
    MoneyUtil.assertValidGrosze(amountGrosze, 'amountGrosze');
    const escrowId = `escrow-${Date.now()}`;

    this.logger.log(
      `[Escrow Safe Settlement] Funds held in escrow: orderId=${orderId}, amount=${MoneyUtil.formatPln(
        amountGrosze,
      )} (${amountGrosze} groszy)`,
    );

    return {
      escrowId,
      orderId,
      amountGrosze,
      status: 'HELD',
      heldAt: new Date(),
    };
  }

  async releaseEscrow(orderId: string, amountGrosze: number): Promise<EscrowReleaseResult> {
    MoneyUtil.assertValidGrosze(amountGrosze, 'amountGrosze');
    const escrowId = `escrow-rel-${Date.now()}`;

    this.logger.log(
      `[Escrow Safe Settlement] Funds captured & released: orderId=${orderId}, amount=${MoneyUtil.formatPln(
        amountGrosze,
      )} (${amountGrosze} groszy)`,
    );

    return {
      escrowId,
      orderId,
      amountGrosze,
      status: 'RELEASED',
      releasedAt: new Date(),
    };
  }

  async refundEscrow(orderId: string, refundGrosze: number): Promise<EscrowRefundResult> {
    MoneyUtil.assertValidGrosze(refundGrosze, 'refundGrosze');
    const escrowId = `escrow-ref-${Date.now()}`;

    this.logger.log(
      `[Escrow Safe Settlement] Escrow refunded: orderId=${orderId}, refund=${MoneyUtil.formatPln(
        refundGrosze,
      )} (${refundGrosze} groszy)`,
    );

    return {
      escrowId,
      orderId,
      refundGrosze,
      status: 'REFUNDED',
      refundedAt: new Date(),
    };
  }
}
