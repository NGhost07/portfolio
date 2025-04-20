import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiOkResponse, ApiQuery, getSchemaPath } from '@nestjs/swagger'
import { PaginationDto, SortOrder } from '../dto'

/**
 * Interface for pagination response
 */
export interface PaginatedResponseDto<T> {
  items: T[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

/**
 * Decorator for paginated API endpoints
 * @param model - The model class for the items in the response
 * @param options - Additional options for the decorator
 * @returns Decorator function
 */
export const ApiPaginated = <T extends Type<any>>(
  model: T,
  options?: {
    description?: string
    sortableFields?: string[]
  },
) => {
  const { description = 'Paginated response', sortableFields = [] } = options || {}

  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  totalItems: {
                    type: 'number',
                    example: 100,
                  },
                  itemCount: {
                    type: 'number',
                    example: 10,
                  },
                  itemsPerPage: {
                    type: 'number',
                    example: 10,
                  },
                  totalPages: {
                    type: 'number',
                    example: 10,
                  },
                  currentPage: {
                    type: 'number',
                    example: 1,
                  },
                },
              },
            },
          },
        ],
      },
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: 'Page number (1-based)',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of items per page',
      type: Number,
      example: 10,
    }),
    ...(sortableFields.length > 0
      ? [
          ApiQuery({
            name: 'sortBy',
            required: false,
            description: `Field to sort by. Available fields: ${sortableFields.join(', ')}`,
            type: String,
            enum: sortableFields,
          }),
          ApiQuery({
            name: 'sortOrder',
            required: false,
            description: 'Sort order',
            enum: SortOrder,
            example: SortOrder.DESC,
          }),
        ]
      : []),
  )
}
