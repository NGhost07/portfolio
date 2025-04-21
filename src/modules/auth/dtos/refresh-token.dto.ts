import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RefreshTokenDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
