import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Polish or international phone number (e.g. +48500100200)',
    example: '+48500100200',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: 'Numer telefonu musi mieć format 9-15 cyfr, opcjonalnie z prefiksem + (np. +48500100200)',
  })
  phone!: string;
}
