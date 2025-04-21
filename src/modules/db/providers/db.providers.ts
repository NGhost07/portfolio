import { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DbOptions } from '../interfaces'

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
