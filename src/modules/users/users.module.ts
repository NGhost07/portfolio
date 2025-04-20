import { Module } from '@nestjs/common'
import { DbModule } from '../db'
import { User, UserSchema } from './schemas'
import { UserService } from './services'
import { UserController } from './controllers'

@Module({
  imports: [
    DbModule.forFeature([
      { name: User.name, schema: UserSchema }
    ])
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UsersModule {}
