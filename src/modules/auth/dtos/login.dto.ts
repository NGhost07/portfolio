import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class LoginDto {
  @ApiProperty({ type: String })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  password: string
}
