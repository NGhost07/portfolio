import { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisModuleOptions } from '../interfaces'

export const REDIS_MODULE_OPTIONS = 'REDIS_MODULE_OPTIONS'

/**
 * Create Redis options provider
 * @returns Provider for Redis options
 */
export const createRedisOptionsProvider = (): Provider => {
  return {
    provide: REDIS_MODULE_OPTIONS,
    useFactory: (configService: ConfigService): RedisModuleOptions => {
      const uri = configService.get<string>('REDIS_URI')

      return {
        uri,
        defaultTTL: 60 * 60, // 1 hour in seconds
        isGlobal: true,
      }
    },
    inject: [ConfigService],
  }
}
