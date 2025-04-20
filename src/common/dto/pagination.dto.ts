import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    type: Number,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10

  @ApiPropertyOptional({
    description: 'Field to sort by',
    type: String,
    default: 'createdAt'
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt'

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC

  /**
   * Get skip value for pagination
   * @returns Number of items to skip
   */
  get skip(): number {
    const page = this.page || 1
    const limit = this.limit || 10
    return (page - 1) * limit
  }

  /**
   * Get sort options for MongoDB
   * @returns Sort options object
   */
  get sort(): Record<string, 1 | -1> | null {
    if (!this.sortBy) return null
    const sortOrder = this.sortOrder || SortOrder.DESC
    return {
      [this.sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
    }
  }
}
