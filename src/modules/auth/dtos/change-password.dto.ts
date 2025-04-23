import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ChangePasswordDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  currentPassword: string

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  newPassword: string
}
