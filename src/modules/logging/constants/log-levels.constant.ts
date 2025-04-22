/**
 * Define log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

/**
 * Define colors for each log level
 */
export const LOG_LEVEL_COLORS = {
  [LogLevel.ERROR]: 'red',
  [LogLevel.WARN]: 'yellow',
  [LogLevel.INFO]: 'green',
  [LogLevel.HTTP]: 'magenta',
  [LogLevel.VERBOSE]: 'cyan',
  [LogLevel.DEBUG]: 'blue',
  [LogLevel.SILLY]: 'grey',
}
