import { Injectable, NotFoundException } from '@nestjs/common'
import { QueryUserDto, UpdateUserDto, CreateUserDto } from '../dtos'
import { DbService } from 'src/modules/db'
import { PaginateModel } from 'mongoose'
import { UserDocument } from '../schemas'

@Injectable()
export class UserService {
  private userModel: PaginateModel<UserDocument>

  constructor(private readonly dbService: DbService) {
    // Get the User model from the DbService
    this.userModel = this.dbService.getModel<UserDocument>('User') as PaginateModel<UserDocument>
  }

  async findUsers(query: QueryUserDto) {
    const { page = 1, limit = 10, ...filters } = query
    return this.userModel.paginate(filters, { page, limit })
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
