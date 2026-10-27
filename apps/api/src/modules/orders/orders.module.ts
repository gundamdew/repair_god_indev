import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderFsmService } from '../../common/fsm/order-fsm.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderFsmService],
  exports: [OrdersService, OrderFsmService],
})
export class OrdersModule {}
