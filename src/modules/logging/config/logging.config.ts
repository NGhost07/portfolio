import { LogLevel } from '../constants'

export interface LoggingConfig {
  console: {
    level: LogLevel
    prettyPrint: boolean
    colorize: boolean
  }
  file: {
    level: LogLevel
    enabled: boolean
    maxSize: string
    maxFiles: string
    dirname: string
  }
}

export const getLoggingConfig = (
  nodeEnv: string = 'development',
): LoggingConfig => {
  const isProd = nodeEnv === 'production'

  return {
    console: {
      // In production, only log info and above to console
      // In development, log everything to console
      // level: isProd ? LogLevel.INFO : LogLevel.SILLY,
      level: LogLevel.INFO,
      prettyPrint: !isProd, // Pretty print JSON in development
      colorize: true, // Always use colors
    },
    file: {
      // In production, log everything to file
      // In development, log debug and above to file
      // level: isProd ? LogLevel.SILLY : LogLevel.DEBUG,
      level: LogLevel.INFO,
      enabled: true, // Enable file logging in both environments
      maxSize: isProd ? '10m' : '5m', // Smaller file size in development
      maxFiles: isProd ? '14d' : '7d', // Keep logs longer in production
      dirname: 'logs',
    },
  }
}
