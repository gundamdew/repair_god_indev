import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ description: 'Associated Order ID', example: 'ord-12345' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiPropertyOptional({ description: 'Drop-off Paczkomat machine code', example: 'WAW01A' })
  @IsString()
  @IsOptional()
  senderLockerCode?: string;

  @ApiPropertyOptional({ description: 'Destination workshop Paczkomat machine code', example: 'WAW99M' })
  @IsString()
  @IsOptional()
  receiverLockerCode?: string;

  @ApiPropertyOptional({ description: 'Sender contact phone', example: '+48500100200' })
  @IsString()
  @IsOptional()
  senderPhone?: string;

  @ApiPropertyOptional({ description: 'Receiver contact phone', example: '+48221002030' })
  @IsString()
  @IsOptional()
  receiverPhone?: string;

  @ApiPropertyOptional({ description: 'InPost locker size category', enum: ['A', 'B', 'C'], default: 'A' })
  @IsOptional()
  @IsIn(['A', 'B', 'C'])
  parcelSize?: 'A' | 'B' | 'C' = 'A';
}
