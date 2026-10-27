import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number used during OTP request',
    example: '+48500100200',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: 'Numer telefonu musi mieć poprawny format (np. +48500100200)',
  })
  phone!: string;

  @ApiProperty({
    description: '6-digit OTP code (in development "123456" is accepted)',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Kod OTP musi składać się z dokładnie 6 cyfr' })
  code!: string;
}
