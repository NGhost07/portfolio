import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { TokenService } from '../services'
import {AuthPayload} from "../types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || '',
      algorithms: ['HS256'],
    })
  }

  /**
   * Validate JWT token and check if it's not revoked
   * @param payload Token payload
   * @returns User information
   */
  async validate(payload: AuthPayload) {
    try {
      if (!payload.sub || !payload.jti) {
        throw new UnauthorizedException('Invalid token payload')
      }

      // Check if token is revoked
      const isValid = await this.tokenService.validateAccessToken(payload.jti)
      if (!isValid) {
        throw new UnauthorizedException('Token has been revoked')
      }

      return payload
    } catch (error) {
      this.logger.error(
        `Token validation failed: ${error.message}`,
        error.stack,
      )
      throw new UnauthorizedException('Invalid token')
    }
  }
}
