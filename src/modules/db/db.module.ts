import { DynamicModule, Module, Provider } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { createDatabaseOptionsProvider, createMultipleDatabaseOptionsProvider } from './providers'
import { DbOptions, ModelDefinition, MultipleDbOptions } from './interfaces'
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
   * Register multiple MongoDB connections using ConfigService
   * This method creates a dynamic module that connects to multiple MongoDB instances
   * using configuration from environment variables
   * @returns DynamicModule
   */
  static forRootMultipleConnections(): DynamicModule {
    const multipleDbOptionsProvider = createMultipleDatabaseOptionsProvider()

    return {
      module: DbModule,
      imports: [
        // Primary connection
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (dbOptions: MultipleDbOptions) => ({
            uri: dbOptions.primary.uri,
            ...dbOptions.primary.options,
          }),
          inject: ['MULTIPLE_DATABASE_OPTIONS'],
        }),

        // Secondary connections (if any)
        ...DbModule.createSecondaryConnectionImports(),
      ],
      providers: [multipleDbOptionsProvider, DbService],
      exports: [MongooseModule, multipleDbOptionsProvider, DbService],
      global: true, // Make the module global so it can be used anywhere
    }
  }

  /**
   * Create imports for secondary connections
   * @private
   * @returns Array of dynamic imports for secondary connections
   */
  private static createSecondaryConnectionImports() {
    return [
      MongooseModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          // Get secondary connection URI directly from config service
          const secondaryUri = configService.get<string>('MONGO_URI_SECONDARY')

          // If no secondary URI, use a dummy URI that won't connect
          // This is a workaround since we can't return null
          if (!secondaryUri) {
            // Return a dummy URI with options that will prevent actual connection attempts
            return {
              uri: 'mongodb://localhost:27017/dummy',
              // These options will prevent actual connection attempts
              autoCreate: false,
              autoIndex: false,
              connectTimeoutMS: 1, // Very short timeout
              socketTimeoutMS: 1,
              serverSelectionTimeoutMS: 1,
              // This is the key option - it will make Mongoose not attempt to connect
              // until a model is actually accessed
              bufferCommands: true,
            }
          }

          // Use the secondary connection URI
          return {
            uri: secondaryUri,
            // Add any additional options here
          }
        },
        inject: [ConfigService],
        connectionName: 'secondary',
      }),
    ]
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
