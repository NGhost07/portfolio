import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DbModule } from './modules/db'
import { ExampleModule } from './modules/example/example.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DbModule.forRoot(),
    ExampleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
