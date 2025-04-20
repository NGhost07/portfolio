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
import { instanceToPlain } from 'class-transformer'

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

        // Convert data to plain object (handles class instances, Date objects, etc.)
        const plainData = data !== null && data !== undefined ? this.transformToPlain(data) : null

        // Handle different response types
        if (plainData === null) {
          // No data returned
          return standardResponse
        } else if (plainData && typeof plainData === 'object' && 'items' in plainData && 'meta' in plainData) {
          // Paginated response
          // Cast items to R type
          standardResponse.data = plainData.items as R

          // Type guard for meta object
          const meta = plainData.meta
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
          standardResponse.data = plainData as R
          return standardResponse
        }
      }),
    )
  }

  /**
   * Transform data to plain object
   * @param data - Data to transform
   * @returns Plain object representation of the data
   */
  private transformToPlain(data: any): any {
    if (data === null || data === undefined) {
      return null
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.transformToPlain(item))
    }

    // Handle Mongoose documents
    if (data && typeof data === 'object') {
      // Check if it's a Mongoose document (has _doc property)
      if (data._doc) {
        return { ...data._doc }
      }

      // Check if it's a Mongoose document with toJSON method
      if (data && typeof data.toJSON === 'function') {
        // Disable ESLint for this line as we've already checked that toJSON is a function
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return data.toJSON()
      }

      // Handle regular objects
      if (Object.getPrototypeOf(data) === Object.prototype) {
        const result = {}
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            result[key] = this.transformToPlain(data[key])
          }
        }
        return result
      }
    }

    // Use class-transformer for class instances
    try {
      return instanceToPlain(data)
    } catch {
      // If all else fails, return the original data
      return data
    }
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
