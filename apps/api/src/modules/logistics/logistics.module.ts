import { Module } from '@nestjs/common';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { LOGISTICS_PORT } from './ports/logistics.port';
import { InPostShipXAdapter } from './adapters/inpost-shipx.adapter';
import { OrderFsmService } from '../../common/fsm/order-fsm.service';

@Module({
  controllers: [LogisticsController],
  providers: [
    LogisticsService,
    OrderFsmService,
    {
      provide: LOGISTICS_PORT,
      useClass: InPostShipXAdapter,
    },
  ],
  exports: [LogisticsService, LOGISTICS_PORT],
})
export class LogisticsModule {}
