import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DbModule } from './modules/db'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Use multiple connections if MONGO_URI_SECONDARY is defined
    DbModule.forRootMultipleConnections(),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
