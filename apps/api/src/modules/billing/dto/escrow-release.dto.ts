import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class EscrowReleaseDto {
  @ApiProperty({ description: 'Order ID to release escrow funds for', example: 'ord-12345' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiPropertyOptional({
    description: 'Amount in grosze to capture/release. Defaults to full order total.',
    example: 45000,
  })
  @IsInt({ message: 'Kwota zwolnienia musi być liczbą całkowitą w groszach' })
  @IsPositive()
  @IsOptional()
  amountGrosze?: number;
}

export class EscrowRefundDto {
  @ApiProperty({ description: 'Order ID to refund escrow from', example: 'ord-12345' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({
    description: 'Refund amount in grosze (e.g. 45000 grosze = 450.00 PLN)',
    example: 45000,
  })
  @IsInt({ message: 'Kwota zwrotu musi być liczbą całkowitą w groszach' })
  @IsPositive()
  refundGrosze!: number;

  @ApiPropertyOptional({
    description: 'Reason for refund / cancellation',
    example: 'Klient odrzucił podwyższoną wycenę po inspekcji technika',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
