import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common'
import { UserService } from '../services'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthUser, SystemRoles } from '../../auth/decorators'
import { SystemRole } from '../enums'
import { AuthPayload } from '../../auth/types'
import {
  ApiPaginated,
  PaginationDto,
  toPaginatedResponse,
} from '../../../common'
import { QueryUserDto, UpdateProfileDto, UpdateUserDto } from '../dtos/user.dto'
import { SystemRolesGuard } from '../../auth/guards'
import { User } from '../schemas'

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Find users' })
  @UseGuards(SystemRolesGuard)
  @SystemRoles(SystemRole.ADMIN)
  @ApiPaginated(User, {
    description: 'List of users with pagination',
    sortableFields: ['createdAt', 'updatedAt'],
  })
  async findUsers(
    @Query() query: QueryUserDto,
    @Query() paginationDto: PaginationDto,
  ) {
    const paginationResult = await this.userService.paginate(
      query,
      paginationDto,
    )

    return {
      message: 'Users retrieved successfully',
      data: toPaginatedResponse(paginationResult),
    }
  }

  @Get('/profile')
  @ApiOperation({ summary: 'Get profile' })
  async getProfile(@AuthUser() authPayload: AuthPayload) {
    return {
      message: 'Profile retrieved successfully',
      data: await this.userService.findOne({ _id: authPayload.sub }),
    }
  }

  @Patch('/profile')
  @ApiOperation({ summary: 'Update profile' })
  async updateProfile(
    @AuthUser() authPayload: AuthPayload,
    @Body() payload: UpdateProfileDto,
  ) {
    const updatedUser = await this.userService.findOneAndUpdate(
      { _id: authPayload.sub },
      payload,
    )

    return {
      message: 'Profile updated successfully',
      data: updatedUser,
    }
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Find user by id' })
  @UseGuards(SystemRolesGuard)
  @SystemRoles(SystemRole.ADMIN)
  async findUserById(@Param('userId') userId: string) {
    const user = await this.userService.findOne({ _id: userId })

    return {
      message: 'User retrieved successfully',
      data: user,
    }
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update user by id' })
  @UseGuards(SystemRolesGuard)
  @SystemRoles(SystemRole.ADMIN)
  async updateUserById(
    @Param('userId') userId: string,
    @Body() payload: UpdateUserDto,
  ) {
    return {
      message: 'User updated successfully',
      data: await this.userService.findOneAndUpdate({ _id: userId }, payload),
    }
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete user by id' })
  @UseGuards(SystemRolesGuard)
  @SystemRoles(SystemRole.ADMIN)
  async deleteUserById(@Param('userId') userId: string) {
    return {
      message: 'User deleted successfully',
      data: await this.userService.deleteOne({ _id: userId }),
    }
  }
}
