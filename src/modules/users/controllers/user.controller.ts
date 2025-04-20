import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { UserService } from '../services'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateUserDto, QueryUserDto, UpdateUserDto } from '../dtos'

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('search')
  @ApiOperation({ summary: 'Find Users' })
  async findUsers(@Query() query: QueryUserDto) {
    return this.userService.findUsers(query)
  }

  @Post()
  @ApiOperation({ summary: 'Create User' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto)
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Find User by userId' })
  async findUserById(@Param('userId') userId: string) {
    return this.userService.findUserById(userId)
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update User by userId' })
  async updateUser(
    @Param('userId') userId: string,
    @Body() payload: UpdateUserDto,
  ) {
    return this.userService.updateUser(userId, payload)
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete User by userId' })
  async deleteUser(@Param('userId') userId: string) {
    return this.userService.deleteUser(userId)
  }
}
