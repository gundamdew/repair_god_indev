import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InPostWebhookDto {
  @ApiProperty({ example: '621000192837465019283746' })
  @IsString()
  @IsNotEmpty()
  trackingNumber!: string;

  @ApiProperty({
    example: 'adopted_at_source_branch',
    description: 'InPost ShipX status event code',
  })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ example: 'Przesyłka została nadana w Paczkomacie' })
  @IsString()
  @IsOptional()
  statusDescription?: string;

  @ApiPropertyOptional({ example: '2026-10-27T18:30:00Z' })
  @IsString()
  @IsOptional()
  datetime?: string;
}
