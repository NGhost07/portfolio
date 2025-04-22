import { Global, Module } from '@nestjs/common'
import * as controllers from './controllers'
import * as services from './services'
import * as strategies from './strategies'
import { UsersModule } from '../users/users.module'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'

@Global()
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory(config: ConfigService) {
        return {
          secret: config.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '1d',
            algorithm: 'HS256',
            audience: config.get('JWT_AUDIENCE') || '',
            issuer: config.get('JWT_ISSUER') || '',
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
