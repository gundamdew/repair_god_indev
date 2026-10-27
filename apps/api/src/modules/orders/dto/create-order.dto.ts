import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'ID of the device to be repaired', example: 'dev-demo-iphone-15-pro' })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiPropertyOptional({ description: 'Selected repair workshop ID', example: 'ws-waw-1' })
  @IsString()
  @IsOptional()
  workshopId?: string;

  @ApiPropertyOptional({
    description: 'Outbound delivery method (Customer -> Workshop)',
    example: 'INPOST_PACZKOMAT',
    default: 'INPOST_PACZKOMAT',
  })
  @IsString()
  @IsOptional()
  deliveryMethod?: string = 'INPOST_PACZKOMAT';

  @ApiPropertyOptional({
    description: 'Return delivery method (Workshop -> Customer)',
    example: 'INPOST_PACZKOMAT',
    default: 'INPOST_PACZKOMAT',
  })
  @IsString()
  @IsOptional()
  returnMethod?: string = 'INPOST_PACZKOMAT';

  @ApiPropertyOptional({
    description: 'InPost locker code for dropoff/pickup',
    example: 'WAW01A',
  })
  @IsString()
  @IsOptional()
  inpostCode?: string;

  @ApiPropertyOptional({
    description: 'Initial estimated repair cost in grosze (e.g. 45000 groszy = 450.00 PLN)',
    example: 45000,
  })
  @IsInt({ message: 'repairGrosze must be an integer in grosze' })
  @IsPositive()
  @IsOptional()
  repairGrosze?: number;

  @ApiPropertyOptional({
    description: 'Logistics and handling fee in grosze (e.g. 1999 groszy = 19.99 PLN)',
    example: 1999,
  })
  @IsInt({ message: 'logisticsGrosze must be an integer in grosze' })
  @IsPositive()
  @IsOptional()
  logisticsGrosze?: number;
}
