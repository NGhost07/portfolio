import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createLogger, format, Logger, transports } from 'winston'
import TransportStream = require('winston-transport')
import * as DailyRotateFile from 'winston-daily-rotate-file'
import { LogLevel, LOG_LEVEL_COLORS } from '../constants'
import * as path from 'path'
import { getLoggingConfig } from '../config'

@Injectable()
export class LoggingService {
  private logger: Logger
  private context: string = 'Application'

  constructor(private configService: ConfigService) {
    this.initializeLogger()
  }

  /**
   * Initialize logger with transports and formats based on environment
   */
  private initializeLogger(): void {
    // Get environment-specific logging configuration
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development'
    const loggingConfig = getLoggingConfig(nodeEnv)

    // Define console format with colors and pretty JSON
    const consoleFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }), // 12-hour format with AM/PM
      format.colorize({
        all: loggingConfig.console.colorize,
        colors: LOG_LEVEL_COLORS,
      }),
      format.printf(({ timestamp, level, message, context, ...meta }) => {
        const contextStr = context ? `[${context}] ` : ''

        // Format metadata as pretty JSON if it exists
        let metaStr = ''
        if (Object.keys(meta).length) {
          try {
            // Use pretty JSON in development, compact in production
            metaStr = loggingConfig.console.prettyPrint
              ? '\n' + JSON.stringify(meta, null, 2)
              : ' ' + JSON.stringify(meta)
          } catch (e) {
            metaStr = JSON.stringify(meta)
          }
        }

        return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`
      }),
    )

    // Define file format (without colors but with structured JSON)
    const fileFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }), // 12-hour format with AM/PM
      format.printf(({ timestamp, level, message, context, ...meta }) => {
        const contextStr = context ? `[${context}] ` : ''

        // For file logs, we use compact JSON to keep each log entry on a single line
        let metaStr = ''
        if (Object.keys(meta).length) {
          try {
            metaStr = ' ' + JSON.stringify(meta)
          } catch (e) {
            // In case of circular references or other JSON errors
            metaStr = ' ' + Object.keys(meta).join(',')
          }
        }

        return `${timestamp} ${level}: ${contextStr}${message}${metaStr}`
      }),
    )

    // Create transports array
    // Use TransportStream[] for the array of transports
    const logTransports: TransportStream[] = [
      new transports.Console({
        format: consoleFormat,
        level: loggingConfig.console.level,
      }),
    ]

    // Add file transport if enabled
    if (loggingConfig.file.enabled) {
      logTransports.push(
        new DailyRotateFile({
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          dirname: path.join(process.cwd(), loggingConfig.file.dirname),
          maxSize: loggingConfig.file.maxSize,
          maxFiles: loggingConfig.file.maxFiles,
          format: fileFormat,
          level: loggingConfig.file.level,
        }),
      )
    }

    // Create logger with transports
    this.logger = createLogger({
      level: LogLevel.SILLY, // Base level (will be filtered by transports)
      transports: logTransports,
    })
  }

  /**
   * Set context for logger
   * @param context Context name
   */
  setContext(context: string): this {
    this.context = context
    return this
  }

  /**
   * Log message with level
   * @param message Log content
   * @param meta Additional metadata
   */
  error(message: string, meta: Record<string, any> = {}): void {
    this.logger.error(message, { context: this.context, ...meta })
  }

  warn(message: string, meta: Record<string, any> = {}): void {
    this.logger.warn(message, { context: this.context, ...meta })
  }

  info(message: string, meta: Record<string, any> = {}): void {
    this.logger.info(message, { context: this.context, ...meta })
  }

  http(message: string, meta: Record<string, any> = {}): void {
    this.logger.http(message, { context: this.context, ...meta })
  }

  debug(message: string, meta: Record<string, any> = {}): void {
    this.logger.debug(message, { context: this.context, ...meta })
  }

  verbose(message: string, meta: Record<string, any> = {}): void {
    this.logger.verbose(message, { context: this.context, ...meta })
  }

  silly(message: string, meta: Record<string, any> = {}): void {
    this.logger.silly(message, { context: this.context, ...meta })
  }
}
