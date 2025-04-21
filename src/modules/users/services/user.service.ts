import { Injectable } from '@nestjs/common'
import { DbService } from 'src/modules/db'
import { FilterQuery, PaginateModel, PaginateOptions, Types } from 'mongoose'
import { User, UserDocument } from '../schemas'
import { QueryUserDto } from '../dtos/user.dto'
import { PaginationDto } from '../../../common'

@Injectable()
export class UserService {
  private userModel: PaginateModel<UserDocument>

  constructor(private readonly dbService: DbService) {
    this.userModel = this.dbService.getModel<UserDocument>(
      'User',
    ) as PaginateModel<UserDocument>
  }

  async paginate(query: QueryUserDto, paginationDto: PaginationDto) {
    const filter: FilterQuery<User> = {}
    if (query.email) filter.email = { $regex: query.email, options: 'i' }
    if (query.fullName)
      filter.fullName = { $regex: query.fullName, options: 'i' }
    if (query.gender) filter.gender = query.gender

    const options: PaginateOptions = {
      page: paginationDto.page,
      limit: paginationDto.limit,
      sort: { [paginationDto.sortBy as any]: paginationDto.sortOrder },
    }

    return this.userModel.paginate(filter, options)
  }

  async create(payload: User): Promise<UserDocument> {
    return this.userModel.create(payload)
  }

  async findOne(
    filter: FilterQuery<User>,
    select?: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne(filter, select)
  }

  async exists(
    filter: FilterQuery<User>,
  ): Promise<{ _id: Types.ObjectId } | null> {
    return this.userModel.exists(filter)
  }

  async findOneAndUpdate(
    filter: FilterQuery<User>,
    update: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(filter, update, { new: true })
  }

  async deleteOne(filter: FilterQuery<User>): Promise<UserDocument | {}> {
    return this.userModel.deleteOne(filter)
  }
}
