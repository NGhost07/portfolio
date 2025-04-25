import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { UserService } from '../../users/services'
import * as bcrypt from 'bcrypt'
import { RegisterDto } from '../dtos'
import { TokenPayload, TokenResponse } from '../interfaces'
import { JwtService } from '@nestjs/jwt'
import { RedisService } from '../../redis'
import { SystemRole } from '../../users/enums'
import { v4 as uuidv4 } from 'uuid'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Registers a new user in the system
   * @param payload - Registration data containing email, password and fullName
   * @returns The created user object without the password
   * @throws ConflictException if email already exists
   */
  async register(payload: RegisterDto) {
    const existingUser = await this.userService.exists({ email: payload.email })
    if (existingUser) throw new ConflictException('Email already exists')

    const user = await this.userService.create({
      fullName: payload.fullName,
      email: payload.email,
      hashedPassword: bcrypt.hashSync(payload.password, 10),
    })

    const { hashedPassword, ...result } = user.toJSON()
    return result
  }

  /**
   * Authenticates a user and generates access and refresh tokens
   * @param user - User object containing _id, fullName and roles
   * @returns TokenResponse containing access_token and refresh_token
   * @throws UnauthorizedException if login fails
   */
  async login(user: any): Promise<TokenResponse> {
    try {
      return this.generateTokens(
        user._id.toString(),
        user.fullName,
        user.roles || [],
      )
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack)
      throw new UnauthorizedException('Login failed')
    }
  }

  /**
   * Logs out a user by revoking their access and refresh tokens
   * @param accessToken - The user's access token
   * @param refreshToken - The user's refresh token
   * @returns Promise that resolves when tokens are revoked
   */
  async logout(accessToken: string, refreshToken: string): Promise<void> {
    const accessTokenPayload = (await this.jwtService.decode(
      accessToken,
    )) as any
    const refreshTokenPayload = (await this.jwtService.decode(
      refreshToken,
    )) as any

    await Promise.all([
      this.revokeToken(accessTokenPayload.jti, accessTokenPayload.exp),
      this.revokeToken(refreshTokenPayload.jti, refreshTokenPayload.exp),
    ])
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userService.findOne(
      { _id: userId },
      '+hashedPassword',
    )

    if (!user || !user.hashedPassword) {
      throw new NotFoundException('User not found')
    }

    if (!bcrypt.compareSync(currentPassword, user.hashedPassword)) {
      throw new UnauthorizedException('Current password is incorrect')
    }

    await this.userService.findOneAndUpdate(
      { _id: userId },
      { hashedPassword: bcrypt.hashSync(newPassword, 10) },
    )

    const now = Math.floor(Date.now() / 1000)
    const ttl = this.configService.get<number>('JWT_ACCESS_EXPIRES_IN')
    await this.redisService.set(`token_iat_available:${userId}`, now, ttl)
  }

  /**
   * Generates new access and refresh tokens using a valid refresh token
   * @param refreshToken - The current refresh token
   * @returns TokenResponse containing new access_token and refresh_token
   * @throws UnauthorizedException if refresh token is invalid
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      })
      const { sub, jti, exp } = payload
      const user = await this.userService.findOne({ _id: sub })
      if (!user) throw new Error('User not found')

      await this.revokeToken(jti, exp)

      return this.generateTokens(
        user._id.toString(),
        user.fullName,
        user.roles || [],
      )
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack)
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  /**
   * Validates a token by checking if it's not blacklisted and not issued before password change
   * @param token - access token or refresh token to validate
   * @returns Boolean indicating if the token is valid
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const payload = this.jwtService.decode(token) as TokenPayload
      if (!payload || !payload.jti || !payload.sub) {
        this.logger.error('Invalid token payload: missing jti or sub')
        return false
      }

      const isBlacklisted = await this.redisService.exists(
        `token_blacklist:${payload.jti}`,
      )
      if (isBlacklisted) {
        this.logger.warn(`Token with jti ${payload.jti} is blacklisted`)
        return false
      }

      if (payload.iat) {
        const tokenIatAvailable = await this.redisService.get<number>(
          `token_iat_available:${payload.sub}`,
        )
        if (tokenIatAvailable && payload.iat < tokenIatAvailable) {
          this.logger.warn(
            `Token for user ${payload.sub} was issued before password change`,
          )
          return false
        }
      }

      return true
    } catch (error) {
      this.logger.error(
        `Failed to validate token: ${error.message}`,
        error.stack,
      )
      return false
    }
  }

  /**
   * Generates access and refresh tokens for a user
   * @param userId - The user's ID
   * @param fullName - The user's full name
   * @param roles - Array of user roles
   * @returns TokenResponse containing access_token and refresh_token
   * @throws UnauthorizedException if token generation fails
   */
  private async generateTokens(
    userId: string,
    fullName: string,
    roles: SystemRole[],
  ): Promise<TokenResponse> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.sign(
          {
            sub: userId,
            jti: uuidv4(),
            fullName,
            roles,
          },
          {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
          },
        ),
        this.jwtService.sign(
          {
            sub: userId,
            jti: uuidv4(),
          },
          {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
          },
        ),
      ])

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      }
    } catch (error) {
      this.logger.error(
        `Failed to refresh token: ${error.message}`,
        error.stack,
      )
      throw new UnauthorizedException(
        `Failed to refresh token: ${error.message}`,
      )
    }
  }

  /**
   * Revokes a token by adding it to the blacklist in Redis
   * @param jti - The JWT ID to revoke
   * @param exp - The token expiration timestamp
   * @returns Promise that resolves when token is added to blacklist
   * @throws Error if token revocation fails
   */
  private async revokeToken(jti: string, exp: number): Promise<void> {
    try {
      // Calculate TTL based on token expiration
      const now = Math.floor(Date.now() / 1000)
      const ttl = Math.max(exp - now, 0)

      // Add token to blacklist
      await this.redisService.set(`token_blacklist:${jti}`, 'true', ttl)
    } catch (error) {
      this.logger.error(`Failed to revoke token: ${error.message}`, error.stack)
      throw new Error('Failed to revoke token')
    }
  }
}
