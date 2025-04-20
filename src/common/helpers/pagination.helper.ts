import { PaginateResult } from 'mongoose'
import { PaginatedResponseDto } from '../decorators'

/**
 * Convert mongoose paginate result to standard paginated response
 * @param result - Mongoose paginate result
 * @returns Standardized paginated response
 */
export function toPaginatedResponse<T>(result: PaginateResult<T>): PaginatedResponseDto<T> {
  return {
    items: result.docs || [],
    meta: {
      totalItems: result.totalDocs || 0,
      itemCount: result.docs?.length || 0,
      itemsPerPage: result.limit || 10,
      totalPages: result.totalPages || 0,
      currentPage: result.page || 1,
    },
  }
}
