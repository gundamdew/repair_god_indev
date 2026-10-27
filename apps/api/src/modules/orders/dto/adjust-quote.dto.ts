import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class AdjustQuoteDto {
  @ApiProperty({
    description: 'Revised repair price in grosze (e.g. 68000 groszy = 680.00 PLN)',
    example: 68000,
  })
  @IsInt({ message: 'newRepairGrosze must be an integer in grosze' })
  @IsPositive()
  newRepairGrosze!: number;

  @ApiProperty({
    description: 'Reason for price adjustment (e.g. additional hidden corrosion found on motherboard)',
    example: 'Wykryto ślady korozji pod ekranem termicznym płyty głównej wymagające mikrolutowania SMD.',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({
    description: 'Evidence inspection photos taken by technician',
    example: ['https://storage.repairgod.pl/qc/corrosion_microscope_1.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidencePhotoUrls?: string[];
}

export class ApproveAdjustmentDto {
  @ApiPropertyOptional({
    description: 'Optional acceptance notes from customer',
    example: 'Zgadzam się na podwyższoną wycenę i naprawę płyty głównej.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectAdjustmentDto {
  @ApiPropertyOptional({
    description: 'Reason for rejection and return request',
    example: 'Zbyt wysoki koszt naprawy w stosunku do wartości urządzenia.',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
