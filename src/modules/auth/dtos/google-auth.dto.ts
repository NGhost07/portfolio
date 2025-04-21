import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class GoogleAuthDto {
  @ApiProperty({ type: String })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  fullName: string

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  googleId: string

  @ApiProperty({ type: String })
  @IsString()
  @IsOptional()
  avatar?: string
}
