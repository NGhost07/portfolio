import { PaginateResult } from 'mongoose'

export interface PaginationMetadata {
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMetadata
}

export function toPaginatedResponse<T>(
  result: PaginateResult<T>,
): PaginatedResponse<T> {
  return {
    items: result.docs,
    meta: {
      totalItems: result.totalDocs || 0,
      totalPages: result.totalPages || 0,
      currentPage: result.page || 1,
      itemsPerPage: result.limit || 10,
      hasNextPage: result.hasNextPage || false,
      hasPrevPage: result.hasPrevPage || false,
    },
  }
}
