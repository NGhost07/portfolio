import { DynamicModule, Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RedisService } from './services'
import { createRedisOptionsProvider } from './providers'
import { RedisModuleOptions } from './interfaces'

@Module({})
export class RedisModule {
  /**
   * Register Redis module with default options
   * @returns Dynamic module
   */
  static forRoot(): DynamicModule {
    const redisOptionsProvider = createRedisOptionsProvider()

    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [redisOptionsProvider, RedisService],
      exports: [redisOptionsProvider, RedisService],
      global: true,
    }
  }

  /**
   * Register Redis module with custom options
   * @param options - Redis module options
   * @returns Dynamic module
   */
  static forRootAsync(options: RedisModuleOptions): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'REDIS_MODULE_OPTIONS',
          useValue: options,
        },
        RedisService,
      ],
      exports: [RedisService],
      global: options.isGlobal ?? true,
    }
  }
}
