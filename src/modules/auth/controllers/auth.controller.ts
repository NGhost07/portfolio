import {
  Body,
  Controller,
  Get,
  NotImplementedException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from '../services'
import {
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from '../dtos'
import { FacebookAuthGuard, GoogleAuthGuard, LocalAuthGuard } from '../guards'
import { AuthUser, Public } from '../decorators'
import { AuthPayload } from '../types'

@Controller('auth')
@ApiTags('Auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @Public()
  @ApiOperation({ summary: 'Resister User' })
  async register(@Body() payload: RegisterDto) {
    return {
      message: 'Register successfully',
      data: await this.authService.register(payload),
    }
  }

  @Post('/login')
  @Public()
  @ApiOperation({ summary: 'Login User' })
  @UseGuards(LocalAuthGuard)
  async login(@Body() payload: LoginDto, @Req() req) {
    return {
      message: 'Login successfully',
      data: await this.authService.login(req.user),
    }
  }

  @Post('/refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh Token' })
  async refresh(@Body() payload: RefreshTokenDto) {
    return {
      message: 'Refresh token successfully',
      data: await this.authService.refreshToken(payload.refreshToken),
    }
  }

  @Post('/logout')
  @ApiOperation({ summary: 'Logout User' })
  async logout(@Body() payload: RefreshTokenDto, @Req() req) {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization
    const accessToken = authHeader?.split(' ')[1]

    // Logout with both refresh token and access token
    await this.authService.logout(payload.refreshToken, accessToken)

    return {
      message: 'Logout successfully',
    }
  }

  @Post('/change-password')
  @ApiOperation({ summary: 'Change Password' })
  async changePassword(
    @AuthUser() authPayload: AuthPayload,
    @Body() payload: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      authPayload.sub,
      payload.currentPassword,
      payload.newPassword,
    )

    return {
      message: 'Change password successfully',
    }
  }

  @Post('/forgot-password')
  @Public()
  @ApiOperation({ summary: 'Forgot Password' })
  async forgotPassword() {
    throw new NotImplementedException()
  }

  @Get('/google')
  @Public()
  @ApiOperation({ summary: 'Google OAuth Login' })
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('/google/callback')
  @Public()
  @ApiOperation({ summary: 'Google OAuth Callback' })
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req) {
    return {
      message: 'Google login successfully',
      data: await this.authService.login(req.user),
    }
  }

  @Get('/facebook')
  @Public()
  @ApiOperation({ summary: 'Facebook OAuth Login' })
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {}

  @Get('/facebook/callback')
  @Public()
  @ApiOperation({ summary: 'Facebook OAuth Callback' })
  @UseGuards(FacebookAuthGuard)
  async facebookAuthCallback(@Req() req) {
    return {
      message: 'Facebook login successfully',
      data: await this.authService.login(req.user),
    }
  }
}
