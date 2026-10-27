import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryWorkshopsDto {
  @ApiPropertyOptional({
    description: 'Sort criteria',
    enum: ['rating', 'dist', 'price', 'turnaround'],
    default: 'rating',
  })
  @IsOptional()
  @IsIn(['rating', 'dist', 'price', 'turnaround'])
  sort?: 'rating' | 'dist' | 'price' | 'turnaround' = 'rating';

  @ApiPropertyOptional({
    description: 'Filter by specialty (e.g. Apple, Samsung, Laptopy, Konsol)',
    example: 'Apple',
  })
  @IsOptional()
  @IsString()
  spec?: string;

  @ApiPropertyOptional({
    description: 'Filter by city or district (e.g. Warszawa, Kraków)',
    example: 'Warszawa',
  })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({
    description: 'Maximum distance in kilometers',
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDist?: number;
}
