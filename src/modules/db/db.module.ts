import { DynamicModule, Module, Provider } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '@nestjs/config'
import { createDatabaseOptionsProvider } from './providers'
import { DbOptions, ModelDefinition } from './interfaces'
import { DbService } from './services'

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
      ],
      providers: [dbOptionsProvider, DbService],
      exports: [MongooseModule, dbOptionsProvider, DbService],
      global: true, // Make the module global so it can be used anywhere
    }
  }

  /**
   * Register feature models
   * This method creates a dynamic module that registers Mongoose models
   * @param models - Array of mongoose models
   * @param connectionName - Name of the connection to use (optional)
   * @returns DynamicModule
   */
  static forFeature(models: ModelDefinition[], connectionName?: string): DynamicModule {
    return {
      module: DbModule,
      imports: [MongooseModule.forFeature(models, connectionName)],
      exports: [MongooseModule],
    }
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
    }
  }
}
