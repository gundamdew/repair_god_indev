import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({
    description: 'Device category (e.g. SMARTPHONE, LAPTOP, TABLET, CONSOLE)',
    example: 'SMARTPHONE',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    description: 'Device brand (e.g. Apple, Samsung, Xiaomi, Sony)',
    example: 'Apple',
  })
  @IsString()
  @IsNotEmpty()
  brand!: string;

  @ApiProperty({
    description: 'Device model (e.g. iPhone 15 Pro, Galaxy S24 Ultra)',
    example: 'iPhone 15 Pro',
  })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiPropertyOptional({
    description: 'Serial number',
    example: 'DNQZL0A00D1P',
  })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiPropertyOptional({
    description: 'IMEI number (15 digits)',
    example: '356938035643803',
  })
  @IsString()
  @IsOptional()
  imei?: string;

  @ApiPropertyOptional({
    description: 'Physical condition (e.g. Broken screen, like new)',
    example: 'Pęknięta szybka, obudowa bez rys',
  })
  @IsString()
  @IsOptional()
  condition?: string;
}
