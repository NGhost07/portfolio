import { DynamicModule, Module, Provider } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '@nestjs/config'
import { createDatabaseOptionsProvider } from './providers'
import { DbOptions } from './interfaces'
import { DbService } from './services'
import { Example, ExampleSchema } from './schemas'

@Module({})
export class DbModule {
  /**
   * Register MongoDB connection using ConfigService
   * This method creates a dynamic module that connects to MongoDB
   * using configuration from environment variables
   * @returns DynamicModule
   */
  static forRoot(): DynamicModule {
    const dbOptionsProvider = createDatabaseOptionsProvider()

    return {
      module: DbModule,
      imports: [
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (dbOptions: DbOptions) => ({
            uri: dbOptions.uri,
            ...dbOptions.options,
          }),
          inject: ['DATABASE_OPTIONS'],
        }),
        // Register core models
        MongooseModule.forFeature([
          { name: Example.name, schema: ExampleSchema },
        ]),
      ],
      providers: [dbOptionsProvider, DbService],
      exports: [MongooseModule, dbOptionsProvider, DbService],
      global: true, // Make the module global so it can be used anywhere
    };
  }

  /**
   * Register feature models
   * This method creates a dynamic module that registers Mongoose models
   * @param models - Array of mongoose models
   * @returns DynamicModule
   */
  static forFeature(models: any[]): DynamicModule {
    return {
      module: DbModule,
      imports: [MongooseModule.forFeature(models)],
      exports: [MongooseModule],
    };
  }

  /**
   * Register custom database providers
   * This method allows for registering custom database providers
   * for future expansion to other database types
   * @param providers - Array of custom providers
   * @returns DynamicModule
   */
  static forProviders(providers: Provider[]): DynamicModule {
    return {
      module: DbModule,
      providers: providers,
      exports: providers,
    };
  }
}