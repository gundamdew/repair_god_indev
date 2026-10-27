import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Matches } from 'class-validator';

export class BlikAuthorizeDto {
  @ApiProperty({ description: 'Order ID to authorize payment for', example: 'ord-12345' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ description: '6-digit BLIK authentication code from banking app', example: '777123' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Kod BLIK musi składać się z 6 cyfr' })
  @Matches(/^[0-9]{6}$/, { message: 'Kod BLIK może zawierać wyłącznie cyfry 0-9' })
  blikCode!: string;

  @ApiProperty({
    description: 'Total payment amount in grosze (e.g. 45000 grosze = 450.00 PLN)',
    example: 45000,
  })
  @IsInt({ message: 'Kwota płatności musi być liczbą całkowitą w groszach (integer)' })
  @IsPositive({ message: 'Kwota płatności musi być większa od zera' })
  amountGrosze!: number;

  @ApiPropertyOptional({ description: 'Optional payment description', example: 'Naprawa iPhone 15 Pro' })
  @IsString()
  @IsOptional()
  description?: string;
}
