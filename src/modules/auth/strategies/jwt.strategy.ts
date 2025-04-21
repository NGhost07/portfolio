import {Injectable, UnauthorizedException} from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { AuthPayload } from '../types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
      algorithms: ['HS256'],
      audience: '',
      issuer: '',
    })
  }

  async validate(payload: AuthPayload) {
    if (!payload.sub)
      throw new UnauthorizedException('Invalid token payload')

    return {
      sub: payload.sub,
      fullName: payload.fullName,
      roles: payload.roles,
    }
  }
}
