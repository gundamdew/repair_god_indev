import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DevicesModule } from './modules/devices/devices.module';
import { DiagnosticsModule } from './modules/diagnostics/diagnostics.module';
import { OrdersModule } from './modules/orders/orders.module';
import { WorkshopsModule } from './modules/workshops/workshops.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { BillingModule } from './modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CustomersModule,
    DevicesModule,
    DiagnosticsModule,
    OrdersModule,
    WorkshopsModule,
    LogisticsModule,
    BillingModule,
  ],
})
export class AppModule {}
