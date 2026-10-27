import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TriageRequestDto {
  @ApiProperty({ example: 'SMARTPHONE', description: 'Device category' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 'Apple', description: 'Device brand' })
  @IsString()
  @IsNotEmpty()
  brand!: string;

  @ApiProperty({ example: 'iPhone 15 Pro', description: 'Device model' })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty({
    example: ['BROKEN_SCREEN', 'TOUCH_UNRESPONSIVE'],
    description: 'List of observed symptom codes or tags',
  })
  @IsArray()
  @IsString({ each: true })
  symptoms!: string[];

  @ApiPropertyOptional({
    example: 'Telefon upadł na kafelki z wysokości 1 metra. Ekran migocze na zielono.',
    description: 'Detailed description by the customer',
  })
  @IsString()
  @IsOptional()
  userDescription?: string;

  @ApiPropertyOptional({
    example: ['https://s3.repairgod.pl/uploads/screen_damage_1.jpg'],
    description: 'Photos uploaded during intake',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoUrls?: string[];

  @ApiPropertyOptional({
    example: 'ord-12345',
    description: 'Optional Order ID if attaching to an existing draft order',
  })
  @IsString()
  @IsOptional()
  orderId?: string;
}
