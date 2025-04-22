import { Global, Module } from '@nestjs/common'
import * as controllers from './controllers'
import * as services from './services'
import * as strategies from './strategies'
import { UsersModule } from '../users/users.module'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'
import { RedisModule } from '../redis'

@Global()
@Module({
  imports: [
    UsersModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory(config: ConfigService) {
        return {
          secret: config.get<string>('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN'),
          },
        }
      },
      inject: [ConfigService],
    }),
    PassportModule,
  ],
  controllers: [...Object.values(controllers)],
  providers: [...Object.values(services), ...Object.values(strategies)],
  exports: [...Object.values(services)],
})
export class AuthModule {}
