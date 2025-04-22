# Logging Module

This module provides a logging system for the application, with the ability to log to both file and console simultaneously. It supports different configurations for development and production environments.

## Features

- Logs to both file and console simultaneously
- Different colors for each log level in the console
- Automatic log file rotation (one file per day)
- Automatic deletion of old log files (configurable retention period)
- Log file size limit (configurable)
- Automatic logging of all requests/responses via interceptor
- Easy to extend and customize
- Uses all log levels for comprehensive logging
- Environment-specific configurations (development vs production)

## Log Levels

The logging system uses the following levels (from highest to lowest priority):

- `error`: Critical errors that prevent the application from functioning
- `warn`: Warnings that might cause issues in the future
- `info`: General information about application operations
- `http`: Information about HTTP requests
- `verbose`: More detailed information than info
- `debug`: Useful information for debugging
- `silly`: Most detailed information, typically only used during development

## Environment Configuration

The logging system supports different configurations for development and production environments:

### Development Environment

```
NODE_ENV=development
```

- Console: All log levels (SILLY and above)
- Console: Pretty-printed JSON for better readability
- File: DEBUG level and above
- File: 5MB max size per file
- File: 7 days retention period

### Production Environment

```
NODE_ENV=production
```

- Console: INFO level and above (reduced verbosity)
- Console: Compact JSON to save space
- File: All log levels (SILLY and above) for complete records
- File: 10MB max size per file
- File: 14 days retention period

## Usage

### Using LoggingService in other services

```typescript
import { Injectable } from '@nestjs/common'
import { LoggingService } from '../logging'

@Injectable()
export class UserService {
  constructor(private readonly loggingService: LoggingService) {
    // Set context for logger
    this.loggingService.setContext('UserService')
  }

  async findAll() {
    this.loggingService.info('Finding all users')
    // ...
    return users
  }

  async findOne(id: string) {
    this.loggingService.info(`Finding user with id: ${id}`)
    // ...
    return user
  }

  async create(data: any) {
    this.loggingService.info('Creating new user', { data })
    try {
      // ...
      this.loggingService.info('User created successfully', { userId: user.id })
      return user
    } catch (error) {
      this.loggingService.error(`Failed to create user: ${error.message}`, {
        error,
        data
      })
      throw error
    }
  }
}
```

### How the Interceptor Uses Different Log Levels

The LoggingInterceptor automatically logs different aspects of requests and responses at appropriate log levels:

- **info**: Basic request/response information
- **debug**: Detailed request/response data
- **verbose**: Performance metrics and detailed execution information
- **warn**: Slow responses, client errors (4xx status codes)
- **error**: Server errors, exceptions, and failures

## Directory Structure

```
src/modules/logging/
├── constants/
│   └── log-levels.constant.ts
├── interceptors/
│   └── logging.interceptor.ts
├── services/
│   └── logging.service.ts
├── index.ts
└── logging.module.ts
```
