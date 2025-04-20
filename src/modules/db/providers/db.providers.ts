import { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DbOptions, MultipleDbOptions } from '../interfaces'

/**
 * Factory provider for database connection options
 */
export const createDatabaseOptionsProvider = (): Provider => ({
  provide: 'DATABASE_OPTIONS',
  useFactory: (configService: ConfigService): DbOptions => {
    const uri = configService.get<string>('MONGO_URI_PRIMARY')

    if (!uri) {
      throw new Error('MONGO_URI_PRIMARY environment variable is not defined')
    }

    return {
      uri,
      options: {
        // Add any additional MongoDB options here
      },
    }
  },
  inject: [ConfigService],
})

/**
 * Factory provider for multiple database connection options
 */
export const createMultipleDatabaseOptionsProvider = (): Provider => ({
  provide: 'MULTIPLE_DATABASE_OPTIONS',
  useFactory: (configService: ConfigService): MultipleDbOptions => {
    // Primary connection is required
    const primaryUri = configService.get<string>('MONGO_URI_PRIMARY')

    if (!primaryUri) {
      throw new Error('MONGO_URI_PRIMARY environment variable is not defined')
    }

    const primary: DbOptions = {
      uri: primaryUri,
      options: {
        // Add any additional MongoDB options here
      },
    }

    // Secondary connection is optional
    const secondaryUri = configService.get<string>('MONGO_URI_SECONDARY')
    const secondary: DbOptions[] = []

    if (secondaryUri) {
      secondary.push({
        uri: secondaryUri,
        connectionName: 'secondary',
        options: {
          // Add any additional MongoDB options here
        },
      })
    }

    return { primary, secondary }
  },
  inject: [ConfigService],
})
