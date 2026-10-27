import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PAYMENT_GATEWAY_PORT } from './ports/payment-gateway.port';
import { MockBlikPaymentAdapter } from './adapters/blik-payment.adapter';
import { OrderFsmService } from '../../common/fsm/order-fsm.service';

@Module({
  controllers: [BillingController],
  providers: [
    BillingService,
    OrderFsmService,
    {
      provide: PAYMENT_GATEWAY_PORT,
      useClass: MockBlikPaymentAdapter,
    },
  ],
  exports: [BillingService, PAYMENT_GATEWAY_PORT],
})
export class BillingModule {}
