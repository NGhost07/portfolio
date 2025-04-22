import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { LoggingService } from '../services'
import { Request, Response } from 'express'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now()
    const request = context.switchToHttp().getRequest<Request>()
    const { method, url, ip, body, headers } = request
    const userAgent = headers['user-agent'] || 'unknown'
    const controller = context.getClass().name
    const handler = context.getHandler().name

    // Set context for logger
    this.loggingService.setContext(`${controller}:${handler}`)

    // Log request information with different levels
    this.loggingService.info(`Request started: ${method} ${url}`)
    this.loggingService.debug(`Request details`, {
      ip,
      userAgent,
      headers: this.sanitizeHeaders(headers),
    })
    this.loggingService.verbose(`Request body`, {
      body: this.sanitizeBody(body),
    })

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse<Response>()
          const { statusCode } = response
          const responseTime = Date.now() - now

          // Log response information with different levels
          if (statusCode >= 400) {
            this.loggingService.warn(
              `Response: ${method} ${url} ${statusCode} - ${responseTime}ms`,
              {
                statusCode,
                responseTime,
              },
            )
          } else {
            this.loggingService.info(
              `Response completed: ${method} ${url} ${statusCode} - ${responseTime}ms`,
              {
                statusCode,
                responseTime,
              },
            )
          }

          // Log response data at debug level
          this.loggingService.debug(`Response data`, {
            data: this.sanitizeResponse(data),
          })

          // Log performance metrics at verbose level
          if (responseTime > 1000) {
            this.loggingService.warn(
              `Slow response detected: ${responseTime}ms`,
              {
                method,
                url,
                responseTime,
              },
            )
          } else {
            this.loggingService.verbose(`Performance metrics`, {
              responseTime,
            })
          }
        },
        error: (error) => {
          const responseTime = Date.now() - now
          const statusCode = error.status || 500

          // Log error information
          this.loggingService.error(
            `Error: ${method} ${url} ${statusCode} - ${responseTime}ms - ${error.message}`,
            {
              statusCode,
              responseTime,
              stack: error.stack,
            },
          )

          // Log additional debug information for errors
          this.loggingService.debug(`Error details`, {
            error: {
              name: error.name,
              message: error.message,
            },
          })
        },
      }),
    )
  }

  /**
   * Sanitize sensitive information from request headers
   * @param headers Request headers
   * @returns Sanitized headers
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return {}

    // Create a deep copy to avoid modifying the original data
    let sanitizedHeaders: any
    try {
      sanitizedHeaders = JSON.parse(JSON.stringify(headers))
    } catch (e) {
      // If we can't stringify/parse (e.g., circular references), create a shallow copy
      sanitizedHeaders = { ...headers }
    }

    // List of sensitive header fields to hide
    const sensitiveFields = [
      'authorization',
      'cookie',
      'x-auth-token',
      'x-api-key',
      'api-key',
      'bearer',
      'x-access-token',
      'jwt-token',
    ]

    // Recursively sanitize the headers data
    const sanitizeObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item))
      }

      // Handle objects
      const sanitized = { ...obj }
      for (const key in sanitized) {
        // Check for case-insensitive matches with sensitive fields
        const keyLower = key.toLowerCase()
        if (
          sensitiveFields.some((field) =>
            keyLower.includes(field.toLowerCase()),
          )
        ) {
          // Redact sensitive fields
          sanitized[key] = '***REDACTED***'
        } else if (
          typeof sanitized[key] === 'object' &&
          sanitized[key] !== null
        ) {
          // Recursively sanitize nested objects
          sanitized[key] = sanitizeObject(sanitized[key])
        }
      }
      return sanitized
    }

    return sanitizeObject(sanitizedHeaders)
  }

  /**
   * Sanitize sensitive information from request body
   * @param body Request body
   * @returns Sanitized body
   */
  private sanitizeBody(body: any): any {
    if (!body) return {}

    // Create a deep copy to avoid modifying the original data
    let sanitizedBody: any
    try {
      sanitizedBody = JSON.parse(JSON.stringify(body))
    } catch (e) {
      // If we can't stringify/parse (e.g., circular references), create a shallow copy
      sanitizedBody = Array.isArray(body) ? [...body] : { ...body }
    }

    // List of sensitive fields to hide
    const sensitiveFields = [
      'password',
      'token',
      'refreshToken',
      'refresh_token',
      'accessToken',
      'access_token',
      'secret',
      'authorization',
      'api_key',
      'apiKey',
      'private_key',
      'privateKey',
    ]

    // Recursively sanitize the body data
    const sanitizeObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item))
      }

      // Handle objects
      const sanitized = { ...obj }
      for (const key in sanitized) {
        if (sensitiveFields.includes(key)) {
          // Redact sensitive fields
          sanitized[key] = '***REDACTED***'
        } else if (
          typeof sanitized[key] === 'object' &&
          sanitized[key] !== null
        ) {
          // Recursively sanitize nested objects
          sanitized[key] = sanitizeObject(sanitized[key])
        }
      }
      return sanitized
    }

    return sanitizeObject(sanitizedBody)
  }

  /**
   * Sanitize sensitive information from response
   * @param data Response data
   * @returns Sanitized data
   */
  private sanitizeResponse(data: any): any {
    if (!data) return null

    // Create a deep copy to avoid modifying the original data
    let sanitizedData: any
    try {
      sanitizedData = JSON.parse(JSON.stringify(data))
    } catch (e) {
      // If we can't stringify/parse (e.g., circular references), create a shallow copy
      sanitizedData = Array.isArray(data) ? [...data] : { ...data }
    }

    // If data is a large object, only return basic information
    if (
      typeof sanitizedData === 'object' &&
      Object.keys(sanitizedData).length > 10
    ) {
      return {
        type: Array.isArray(sanitizedData) ? 'array' : 'object',
        size: Array.isArray(sanitizedData)
          ? sanitizedData.length
          : Object.keys(sanitizedData).length,
        preview: '***LARGE RESPONSE***',
      }
    }

    // List of sensitive fields that should be redacted in the response
    const sensitiveResponseFields = [
      'password',
      'token',
      'access_token',
      'accessToken',
      'refresh_token',
      'refreshToken',
      'secret',
      'authorization',
      'api_key',
      'apiKey',
      'private_key',
      'privateKey',
    ]

    // Recursively sanitize the response data
    const sanitizeObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item))
      }

      // Handle objects
      const sanitized = { ...obj }
      for (const key in sanitized) {
        if (sensitiveResponseFields.includes(key)) {
          // Redact sensitive fields
          sanitized[key] = '***REDACTED***'
        } else if (
          typeof sanitized[key] === 'object' &&
          sanitized[key] !== null
        ) {
          // Recursively sanitize nested objects
          sanitized[key] = sanitizeObject(sanitized[key])
        }
      }
      return sanitized
    }

    return sanitizeObject(sanitizedData)
  }
}
