import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { Gender } from '../enums'

export class UpdateProfileDto {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  fullName?: string

  @ApiPropertyOptional({ type: String, enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender
}

export class UpdateUserDto {}

export class QueryUserDto {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  fullName?: string

  @ApiPropertyOptional({ type: String, enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender
}
