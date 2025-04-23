import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { AuthPayload } from '../types'
import { AuthService } from '../services'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name)

  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || '',
    })
  }

  /**
   * Validate JWT token and check if it's not revoked
   * @param payload Token payload
   * @returns User information
   */
  async validate(payload: AuthPayload) {
    // Validate payload structure
    if (!payload.sub || !payload.jti) {
      this.logger.error('Invalid token payload: missing sub or jti')
      throw new UnauthorizedException('Invalid token payload')
    }

    const isRevoked = await this.authService.checkTokenIsRevoked(payload.jti)
    if (isRevoked) {
      this.logger.warn(`Token with jti ${payload.jti} has been revoked`)
      // Return early with a clear error message
      throw new UnauthorizedException('Token has been revoked')
    }

    return payload
  }
}
