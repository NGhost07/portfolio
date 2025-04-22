import { ConflictException, Injectable } from '@nestjs/common'
import { UserService } from '../../users/services'
import * as bcrypt from 'bcrypt'
import { RegisterDto } from '../dtos'
import { AuthPayload, JwtSign } from '../types'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly userService: UserService,
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

  async login(user: any) {
    const authPayload: AuthPayload = {
      sub: user._id,
      fullName: user.fullName,
      roles: user.roles,
    }

    return this.jwtSign(authPayload)
  }

  async jwtRefresh(refreshToken: string): Promise<JwtSign> {
    const payload = this.jwt.verify(refreshToken, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    })
    const user = await this.userService.findOne({ _id: payload.sub })
    if (!user) throw new Error('User not found')

    const authPayload: AuthPayload = {
      sub: user._id.toString(),
      fullName: user.fullName,
      roles: user.roles,
    }

    return this.jwtSign(authPayload)
  }

  private jwtSign(payload: AuthPayload): JwtSign {
    return {
      access_token: this.jwt.sign(payload, {
        algorithm: 'HS256',
        audience: this.config.get<string>('JWT_AUDIENCE') || '',
        issuer: this.config.get<string>('JWT_ISSUER') || '',
      }),
      refresh_token: this.jwtSignRefresh(payload),
    }
  }

  private jwtSignRefresh(payload: AuthPayload): string {
    return this.jwt.sign(
      { sub: payload.sub },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    )
  }
}
