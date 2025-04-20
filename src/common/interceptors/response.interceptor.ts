import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Response } from 'express'

/**
 * Interface for pagination metadata
 */
export interface PaginationMeta {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

/**
 * Interface for standardized API response
 */
export interface ApiResponse<T> {
  statusCode: number
  message: string
  data: T | null
  pagination?: PaginationMeta
}

/**
 * Interceptor to standardize API responses
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  /**
   * Intercept method to transform the response
   * @param context - Execution context
   * @param next - Call handler
   * @returns Observable with standardized response
   */
  intercept<R>(context: ExecutionContext, next: CallHandler<R>): Observable<ApiResponse<R>> {
    const ctx = context.switchToHttp()
    const response = ctx.getResponse<Response>()
    const statusCode = response.statusCode || HttpStatus.OK

    return next.handle().pipe(
      map((data) => {
        // Default response structure
        const standardResponse: ApiResponse<R> = {
          statusCode,
          message: this.getMessageForStatusCode(statusCode),
          data: null,
        }

        // Handle different response types
        if (data === null || data === undefined) {
          // No data returned
          return standardResponse
        } else if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          // Paginated response
          // Cast items to R type
          standardResponse.data = data.items as R

          // Type guard for meta object
          const meta = data.meta as any
          if (this.isValidPaginationMeta(meta)) {
            standardResponse.pagination = {
              totalItems: meta.totalItems,
              itemCount: meta.itemCount,
              itemsPerPage: meta.itemsPerPage,
              totalPages: meta.totalPages,
              currentPage: meta.currentPage,
            }
          }
          return standardResponse
        } else {
          // Regular data response
          standardResponse.data = data
          return standardResponse
        }
      }),
    )
  }

  /**
   * Check if an object is a valid pagination meta object
   * @param obj - Object to check
   * @returns True if the object is a valid pagination meta object
   */
  private isValidPaginationMeta(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      'totalItems' in obj &&
      'itemCount' in obj &&
      'itemsPerPage' in obj &&
      'totalPages' in obj &&
      'currentPage' in obj &&
      typeof obj.totalItems === 'number' &&
      typeof obj.itemCount === 'number' &&
      typeof obj.itemsPerPage === 'number' &&
      typeof obj.totalPages === 'number' &&
      typeof obj.currentPage === 'number'
    )
  }

  /**
   * Get appropriate message for HTTP status code
   * @param statusCode - HTTP status code
   * @returns Message corresponding to the status code
   */
  private getMessageForStatusCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.OK:
        return 'Success'
      case HttpStatus.CREATED:
        return 'Created successfully'
      case HttpStatus.ACCEPTED:
        return 'Accepted'
      case HttpStatus.NO_CONTENT:
        return 'No content'
      case HttpStatus.BAD_REQUEST:
        return 'Bad request'
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized'
      case HttpStatus.FORBIDDEN:
        return 'Forbidden'
      case HttpStatus.NOT_FOUND:
        return 'Not found'
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal server error'
      default:
        return 'Success'
    }
  }
}
