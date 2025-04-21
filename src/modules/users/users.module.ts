import { Module } from '@nestjs/common'
import { DbModule } from '../db'
import { User, UserSchema } from './schemas'
import * as services from './services'
import * as controllers from './controllers'

@Module({
  imports: [DbModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [...Object.values(controllers)],
  providers: [...Object.values(services)],
  exports: [...Object.values(services)],
})
export class UsersModule {}
