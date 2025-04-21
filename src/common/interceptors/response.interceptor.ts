import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { instanceToPlain } from 'class-transformer'
import { Response } from 'express'
import { PaginateResult } from 'mongoose'

export interface PaginationMeta {
  totalItems: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ApiResponse<T> {
  statusCode: number
  message: string
  data: T | null
  pagination?: PaginationMeta
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp()
    const response = ctx.getResponse<Response>()
    const statusCode = response.statusCode || HttpStatus.OK

    return next.handle().pipe(
      map((data) => {
        response.status(statusCode)

        return this.transformResponse(data, statusCode)
      }),
    )
  }

  private transformResponse(
    data: any,
    statusCode: number = HttpStatus.OK,
  ): ApiResponse<T> {
    const standardResponse: ApiResponse<T> = {
      statusCode,
      message: 'Success',
      data: null,
    }

    if (data === null || data === undefined) {
      return standardResponse
    }

    const plainData = this.transformToPlain(data)

    if (plainData && typeof plainData === 'object') {
      if (
        'statusCode' in plainData &&
        typeof plainData.statusCode === 'number'
      ) {
        standardResponse.statusCode = plainData.statusCode
      }

      if ('message' in plainData && typeof plainData.message === 'string') {
        standardResponse.message = plainData.message
      }

      if ('data' in plainData) {
        standardResponse.data = plainData.data as T

        if (
          standardResponse.data &&
          typeof standardResponse.data === 'object' &&
          'items' in standardResponse.data &&
          'meta' in standardResponse.data
        ) {
          const { items, meta } = standardResponse.data as any

          standardResponse.data = items as T

          if (meta && typeof meta === 'object') {
            standardResponse.pagination = {
              totalItems: meta.totalItems || 0,
              totalPages: meta.totalPages || 0,
              currentPage: meta.currentPage || 1,
              hasNextPage:
                meta.hasNextPage !== undefined
                  ? meta.hasNextPage
                  : meta.currentPage < meta.totalPages,
              hasPrevPage:
                meta.hasPrevPage !== undefined
                  ? meta.hasPrevPage
                  : meta.currentPage > 1,
            }
          }
        } else if (
          standardResponse.data &&
          typeof standardResponse.data === 'object' &&
          '_pagination' in standardResponse.data
        ) {
          const paginationResult = standardResponse.data
            ._pagination as PaginateResult<any>

          if (paginationResult) {
            standardResponse.pagination = {
              totalItems: paginationResult.totalDocs || 0,
              totalPages: paginationResult.totalPages || 0,
              currentPage: paginationResult.page || 1,
              hasNextPage: paginationResult.hasNextPage || false,
              hasPrevPage: paginationResult.hasPrevPage || false,
            }

            delete standardResponse.data._pagination
          }
        }

        return standardResponse
      }

      if (
        'docs' in plainData &&
        'totalDocs' in plainData &&
        'page' in plainData &&
        'totalPages' in plainData
      ) {
        standardResponse.data = plainData.docs as T
        standardResponse.pagination = {
          totalItems: plainData.totalDocs || 0,
          totalPages: plainData.totalPages || 0,
          currentPage: plainData.page || 1,
          hasNextPage: plainData.hasNextPage || false,
          hasPrevPage: plainData.hasPrevPage || false,
        }
        return standardResponse
      }
    }

    standardResponse.data = plainData as T
    return standardResponse
  }

  private transformToPlain(data: any): any {
    if (data === null || data === undefined) {
      return null
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transformToPlain(item))
    }

    if (data && typeof data === 'object') {
      if (typeof data.toJSON === 'function') {
        return data.toJSON()
      }

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

    try {
      return instanceToPlain(data)
    } catch {
      return data
    }
  }
}
