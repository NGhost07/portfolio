import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { UserService } from '../../users/services'
import * as bcrypt from 'bcrypt'
import { RegisterDto } from '../dtos'
import { TokenService } from './token.service'
import { TokenResponse } from '../interfaces'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

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

  async login(user: any): Promise<TokenResponse> {
    try {
      return this.tokenService.generateTokens(
        user._id.toString(),
        user.fullName,
        user.roles || [],
      )
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack)
      throw new UnauthorizedException('Login failed')
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      return this.tokenService.refreshAccessToken(refreshToken)
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`, error.stack)
      throw new UnauthorizedException('Invalid refresh token')
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await this.tokenService.logout(refreshToken)
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`, error.stack)
      // Don't throw error for logout - it's okay if token is already invalid
    }
  }
}
