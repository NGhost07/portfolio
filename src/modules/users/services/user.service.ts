import { Injectable, NotFoundException } from '@nestjs/common'
import { QueryUserDto, UpdateUserDto, CreateUserDto } from '../dtos'
import { DbService } from 'src/modules/db'
import { PaginateModel } from 'mongoose'
import { toPaginatedResponse } from 'src/common/helpers'
import { SortOrder } from 'src/common/dto/pagination.dto'
import { UserDocument } from '../schemas'

@Injectable()
export class UserService {
  private userModel: PaginateModel<UserDocument>

  constructor(private readonly dbService: DbService) {
    // Get the User model from the DbService
    this.userModel = this.dbService.getModel<UserDocument>('User') as PaginateModel<UserDocument>
  }

  async findUsers(query: QueryUserDto) {
    console.log(query)
    const { page, limit, sortBy, sortOrder, ...rawFilters } = query

    // Ensure sortBy is a string
    const sortField = sortBy as string

    // Remove undefined values from filters
    const filters = Object.entries(rawFilters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})

    const options = {
      page,
      limit,
      sort: { [sortField]: sortOrder === SortOrder.ASC ? 1 : -1 }
    }

    console.log(filters)
    console.log(options)

    const result = await this.userModel.paginate(filters, options)
    return toPaginatedResponse(result)
  }

  async findUserById(userId: string) {
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }
    return user
  }

  async createUser(data: CreateUserDto) {
    const user = new this.userModel(data)
    return user.save()
  }

  async updateUser(userId: string, payload: UpdateUserDto) {
    const user = await this.userModel.findByIdAndUpdate(userId, payload, { new: true })
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }
    return user
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findByIdAndDelete(userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }
    return user
  }
}
