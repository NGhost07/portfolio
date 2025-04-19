import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'

/**
 * Database service for handling database operations
 */
@Injectable()
export class DbService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DbService.name)

  // Expose models for easy access from other modules

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {
    this.logger.log('Database service initialized')

    // Initialize model properties
  }

  /**
   * Get the MongoDB connection
   * @returns MongoDB connection
   */
  getConnection(): Connection {
    return this.connection
  }

  /**
   * Check if the database connection is established
   * @returns boolean indicating if the connection is established
   */
  isConnected(): boolean {
    return this.connection.readyState === 1
  }

  /**
   * Called when the application is bootstrapped
   * Use this to run migrations or other startup tasks
   */
  onApplicationBootstrap(): any {
    const startTime = new Date().getTime()

    this.runMigrations().then(() => {
      this.logger.log(`Took ${~~((new Date().getTime() - startTime) / 100) / 10}s to migrate.`)
    })
  }

  /**
   * Run database migrations
   * This method runs all pending migrations in order
   */
  async runMigrations() {
  }
}
