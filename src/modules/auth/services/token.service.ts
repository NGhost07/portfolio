import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { RedisService } from '../../redis'
import { v4 as uuidv4 } from 'uuid'
import { SystemRole } from '../../users/enums'
import { TokenPayload, TokenResponse } from '../interfaces'

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async generateTokens(
    userId: string,
    fullName: string,
    roles: SystemRole[],
  ): Promise<TokenResponse> {
    try {
      // Generate unique JTIs (JWT IDs) for both tokens
      const accessTokenJti = uuidv4()
      const refreshTokenJti = uuidv4()

      // Create access token payload
      const accessPayload: TokenPayload = {
        sub: userId,
        jti: accessTokenJti,
        fullName,
        roles,
      }

      // Create refresh token payload
      const refreshPayload: TokenPayload = {
        sub: userId,
        jti: refreshTokenJti,
      }

      // Generate access token
      const accessToken = this.jwtService.sign(accessPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
      })

      // Generate refresh token with minimal payload
      const refreshToken = this.jwtService.sign(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      })

      // Store refresh token in Redis allowlist
      await this.storeRefreshToken(refreshTokenJti, userId)

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      }
    } catch (error) {
      this.logger.error(
        `Failed to generate tokens: ${error.message}`,
        error.stack,
      )
      throw new Error('Failed to generate authentication tokens')
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as TokenPayload

      const { sub: userId, jti: refreshTokenJti } = payload

      // Check if refresh token is in allowlist
      const isValid = await this.validateRefreshToken(refreshTokenJti)
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      // Get user information (you might need to fetch this from your user service)
      // For this example, we'll use minimal information
      const fullName = 'User' // Replace with actual user data
      const roles = [SystemRole.USER] // Replace with actual user roles

      // Revoke old refresh token
      await this.revokeRefreshToken(refreshTokenJti)

      // Generate new tokens
      return this.generateTokens(userId, fullName, roles)
    } catch (error) {
      this.logger.error(
        `Failed to refresh token: ${error.message}`,
        error.stack,
      )
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async validateAccessToken(jti: string): Promise<boolean> {
    try {
      // Check if token is in the blacklist
      const isBlacklisted = await this.redisService.exists(`blacklist:${jti}`)
      return !isBlacklisted
    } catch (error) {
      this.logger.error(
        `Failed to validate access token: ${error.message}`,
        error.stack,
      )
      return false
    }
  }

  async validateRefreshToken(jti: string): Promise<boolean> {
    try {
      // Check if token is in the allowlist
      return await this.redisService.exists(`refresh:${jti}`)
    } catch (error) {
      this.logger.error(
        `Failed to validate refresh token: ${error.message}`,
        error.stack,
      )
      return false
    }
  }

  async revokeAccessToken(jti: string, exp: number): Promise<void> {
    try {
      // Calculate TTL based on token expiration
      const now = Math.floor(Date.now() / 1000)
      const ttl = Math.max(exp - now, 0)

      // Add token to blacklist
      await this.redisService.set(`blacklist:${jti}`, 'true', ttl)
    } catch (error) {
      this.logger.error(
        `Failed to revoke access token: ${error.message}`,
        error.stack,
      )
      throw new Error('Failed to revoke access token')
    }
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    try {
      // Remove token from allowlist
      await this.redisService.delete(`refresh:${jti}`)
    } catch (error) {
      this.logger.error(
        `Failed to revoke refresh token: ${error.message}`,
        error.stack,
      )
      throw new Error('Failed to revoke refresh token')
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        ignoreExpiration: true, // Allow expired tokens to be revoked
      }) as TokenPayload

      // Revoke refresh token
      await this.revokeRefreshToken(payload.jti)

      // Optionally blacklist access token if it's not expired yet
      if (payload.exp && payload.exp > Math.floor(Date.now() / 1000)) {
        await this.revokeAccessToken(payload.jti, payload.exp)
      }
    } catch (error) {
      this.logger.error(`Failed to logout: ${error.message}`, error.stack)
      // Don't throw error for logout - it's okay if token is already invalid
    }
  }

  private async storeRefreshToken(jti: string, userId: string): Promise<void> {
    try {
      const refreshExpiry =
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '1d'

      // Convert '1d' to seconds (86400)
      const ttlInSeconds = refreshExpiry.includes('d')
        ? parseInt(refreshExpiry.replace('d', '')) * 24 * 60 * 60
        : refreshExpiry.includes('h')
          ? parseInt(refreshExpiry.replace('h', '')) * 60 * 60
          : refreshExpiry.includes('m')
            ? parseInt(refreshExpiry.replace('m', '')) * 60
            : parseInt(refreshExpiry)

      if (isNaN(ttlInSeconds)) {
        throw new Error('Invalid refresh token expiration format')
      }

      await this.redisService.set(`refresh:${jti}`, userId, ttlInSeconds)
    } catch (error) {
      this.logger.error(
        `Failed to store refresh token: ${error.message}`,
        error.stack,
      )
      throw new Error('Failed to store refresh token')
    }
  }
}
