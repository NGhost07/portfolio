import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectConnection, getModelToken } from '@nestjs/mongoose'
import { Connection, Model } from 'mongoose'
import { ModuleRef } from '@nestjs/core'

/**
 * Database service for handling database operations
 */
@Injectable()
export class DbService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DbService.name)
  private readonly modelRegistry = new Map<string, Model<any>>()
  private readonly connectionRegistry = new Map<string, Connection>()

  constructor(
    @InjectConnection() private readonly primaryConnection: Connection,
    private readonly moduleRef: ModuleRef,
  ) {
    this.logger.log('Database service initialized')

    // Register primary connection
    this.connectionRegistry.set('primary', primaryConnection)
  }

  /**
   * Get a model by name
   * @param modelName - Name of the model to get
   * @param connectionName - Name of the connection to use (default: 'primary')
   * @returns Model instance
   */
  getModel<T = any>(modelName: string, connectionName = 'primary'): Model<T> {
    // Create a unique key for the model registry
    const modelKey = `${connectionName}:${modelName}`

    // Check if model is already in registry
    if (this.modelRegistry.has(modelKey)) {
      return this.modelRegistry.get(modelKey) as Model<T>
    }

    try {
      // Try to get model from NestJS DI container
      let modelToken = getModelToken(modelName)

      // If using a non-primary connection, use the connection-specific token
      if (connectionName !== 'primary') {
        modelToken = getModelToken(modelName, connectionName)
      }

      const model = this.moduleRef.get(modelToken, { strict: false })

      if (model) {
        // Add to registry for future use
        this.modelRegistry.set(modelKey, model)
        return model as Model<T>
      }
    } catch (error) {
      this.logger.warn(
        `Model ${modelName} not found in DI container: ${error.message}`,
      )
    }

    // Get the appropriate connection
    const connection = this.getConnection(connectionName)

    if (!connection) {
      this.logger.error(`Connection ${connectionName} not found`)
      throw new Error(`Connection ${connectionName} not found`)
    }

    // Try to get model directly from Mongoose connection
    try {
      const model = connection.model(modelName) as unknown as Model<T>
      this.modelRegistry.set(modelKey, model)
      return model
    } catch (error) {
      this.logger.error(
        `Failed to get model ${modelName} from connection ${connectionName}: ${error.message}`,
      )
      throw new Error(
        `Model ${modelName} not found in connection ${connectionName}`,
      )
    }
  }

  /**
   * Get a MongoDB connection by name
   * @param connectionName - Name of the connection to get (default: 'primary')
   * @returns MongoDB connection or undefined if not found
   */
  getConnection(connectionName = 'primary'): Connection | undefined {
    return this.connectionRegistry.get(connectionName)
  }

  /**
   * Get all registered connections
   * @returns Map of connection names to connections
   */
  getAllConnections(): Map<string, Connection> {
    return this.connectionRegistry
  }

  /**
   * Check if a database connection is established
   * @param connectionName - Name of the connection to check (default: 'primary')
   * @returns boolean indicating if the connection is established
   */
  isConnected(connectionName = 'primary'): boolean {
    const connection = this.getConnection(connectionName)
    return connection ? connection.readyState === 1 : false
  }

  /**
   * Called when the application is bootstrapped
   * Use this to run migrations or other startup tasks
   */
  onApplicationBootstrap(): any {
    const startTime = new Date().getTime()

    this.runMigrations().then(() => {
      this.logger.log(
        `Took ${~~((new Date().getTime() - startTime) / 100) / 10}s to migrate.`,
      )
    })
  }

  /**
   * Run database migrations
   * This method runs all pending migrations in order
   */
  async runMigrations() {}
}
