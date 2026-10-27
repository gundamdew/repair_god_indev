import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'Michał Kowalski' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'michal.kowalski@example.pl' })
  @IsEmail({}, { message: 'Niepoprawny format adresu e-mail' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'pl' })
  @IsString()
  @IsOptional()
  lang?: string;
}
