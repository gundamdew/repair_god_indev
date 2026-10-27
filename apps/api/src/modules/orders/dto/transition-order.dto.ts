import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ORDER_STATUSES, OrderStatusType } from '../../../common/fsm/order-fsm.constants';

export class TransitionOrderDto {
  @ApiProperty({
    description: 'Target state according to Finite State Machine rules',
    enum: ORDER_STATUSES,
    example: 'Diagnosed',
  })
  @IsNotEmpty()
  @IsIn(ORDER_STATUSES as unknown as string[], {
    message: 'toStatus must be a valid FSM OrderStatus',
  })
  toStatus!: OrderStatusType;

  @ApiPropertyOptional({
    description: 'Actor triggering the transition (e.g. CUSTOMER, TECHNICIAN, SYSTEM, COURIER)',
    example: 'TECHNICIAN',
    default: 'SYSTEM',
  })
  @IsString()
  @IsOptional()
  actor?: string = 'SYSTEM';

  @ApiPropertyOptional({
    description: 'Optional metadata / audit trail context for the transition event',
    example: { reason: 'Preliminary inspection completed', technicianId: 'tech-01' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
