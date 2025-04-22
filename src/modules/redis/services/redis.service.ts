import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private readonly client: Redis
  private readonly defaultTTL: number

  constructor(private readonly configService: ConfigService) {
    this.defaultTTL = 3600 // 1 hour in seconds
    this.client = this.createRedisClient()
  }

  /**
   * Create Redis client instance
   * @returns Redis client
   */
  private createRedisClient(): Redis {
    const redisUri = this.configService.get<string>('REDIS_URI')

    if (!redisUri) {
      this.logger.warn(
        'REDIS_URI not found in environment variables. Using default connection.',
      )
      return new Redis()
    }

    try {
      const client = new Redis(redisUri)

      client.on('connect', () => {
        this.logger.log('Successfully connected to Redis')
      })

      client.on('error', (error) => {
        this.logger.error(
          `Redis connection error: ${error.message}`,
          error.stack,
        )
      })

      return client
    } catch (error) {
      this.logger.error(
        `Failed to create Redis client: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }

  /**
   * Get Redis client instance
   * @returns Redis client
   */
  getClient(): Redis {
    return this.client
  }

  /**
   * Check if Redis is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.client.status === 'ready'
  }

  /**
   * Set a value in Redis
   * @param key - Key to store the value under
   * @param value - Value to store (will be JSON stringified if not a string)
   * @param ttl - Time to live in seconds (optional, defaults to 1 hour)
   * @returns Promise resolving to "OK" if successful
   */
  async set(key: string, value: any, ttl?: number): Promise<string> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value)

    if (ttl) {
      return this.client.set(key, stringValue, 'EX', ttl)
    }

    return this.client.set(key, stringValue, 'EX', this.defaultTTL)
  }

  /**
   * Get a value from Redis
   * @param key - Key to retrieve
   * @param parse - Whether to parse the value as JSON (default: true)
   * @returns Promise resolving to the value or null if not found
   */
  async get<T = any>(key: string, parse: boolean = true): Promise<T | null> {
    const value = await this.client.get(key)

    if (!value) {
      return null
    }

    if (parse) {
      try {
        return JSON.parse(value) as T
      } catch (e) {
        return value as unknown as T
      }
    }

    return value as unknown as T
  }

  /**
   * Delete a key from Redis
   * @param key - Key to delete
   * @returns Promise resolving to number of keys removed
   */
  async delete(key: string): Promise<number> {
    return this.client.del(key)
  }

  /**
   * Delete multiple keys from Redis
   * @param keys - Array of keys to delete
   * @returns Promise resolving to number of keys removed
   */
  async deleteMany(keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0
    }

    return this.client.del(...keys)
  }

  /**
   * Check if a key exists in Redis
   * @param key - Key to check
   * @returns Promise resolving to true if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  /**
   * Set key expiration time
   * @param key - Key to set expiration for
   * @param ttl - Time to live in seconds
   * @returns Promise resolving to 1 if successful, 0 if key doesn't exist
   */
  async expire(key: string, ttl: number): Promise<number> {
    return this.client.expire(key, ttl)
  }

  /**
   * Get key expiration time in seconds
   * @param key - Key to get expiration for
   * @returns Promise resolving to remaining time to live in seconds, -1 if key has no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key)
  }

  /**
   * Increment a number stored at key
   * @param key - Key to increment
   * @param increment - Increment value (default: 1)
   * @returns Promise resolving to the value after increment
   */
  async increment(key: string, increment: number = 1): Promise<number> {
    return this.client.incrby(key, increment)
  }

  /**
   * Decrement a number stored at key
   * @param key - Key to decrement
   * @param decrement - Decrement value (default: 1)
   * @returns Promise resolving to the value after decrement
   */
  async decrement(key: string, decrement: number = 1): Promise<number> {
    return this.client.decrby(key, decrement)
  }

  /**
   * Set a hash field
   * @param key - Hash key
   * @param field - Hash field
   * @param value - Value to set
   * @returns Promise resolving to 1 if field is new, 0 if field was updated
   */
  async hset(key: string, field: string, value: any): Promise<number> {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value)
    return this.client.hset(key, field, stringValue)
  }

  /**
   * Get a hash field
   * @param key - Hash key
   * @param field - Hash field
   * @param parse - Whether to parse the value as JSON (default: true)
   * @returns Promise resolving to the field value or null if not found
   */
  async hget<T = any>(
    key: string,
    field: string,
    parse: boolean = true,
  ): Promise<T | null> {
    const value = await this.client.hget(key, field)

    if (!value) {
      return null
    }

    if (parse) {
      try {
        return JSON.parse(value) as T
      } catch (e) {
        return value as unknown as T
      }
    }

    return value as unknown as T
  }

  /**
   * Get all hash fields and values
   * @param key - Hash key
   * @param parse - Whether to parse values as JSON (default: true)
   * @returns Promise resolving to object with field-value pairs
   */
  async hgetall<T = any>(
    key: string,
    parse: boolean = true,
  ): Promise<Record<string, T>> {
    const result = await this.client.hgetall(key)

    if (!result || Object.keys(result).length === 0) {
      return {}
    }

    if (parse) {
      const parsedResult: Record<string, T> = {}

      for (const field in result) {
        try {
          parsedResult[field] = JSON.parse(result[field]) as T
        } catch (e) {
          parsedResult[field] = result[field] as unknown as T
        }
      }

      return parsedResult
    }

    return result as unknown as Record<string, T>
  }

  /**
   * Delete a hash field
   * @param key - Hash key
   * @param field - Hash field to delete
   * @returns Promise resolving to 1 if field was removed, 0 if field doesn't exist
   */
  async hdel(key: string, field: string): Promise<number> {
    return this.client.hdel(key, field)
  }

  /**
   * Check if hash field exists
   * @param key - Hash key
   * @param field - Hash field to check
   * @returns Promise resolving to true if field exists, false otherwise
   */
  async hexists(key: string, field: string): Promise<boolean> {
    const result = await this.client.hexists(key, field)
    return result === 1
  }

  /**
   * Add members to a set
   * @param key - Set key
   * @param members - Members to add
   * @returns Promise resolving to number of members added
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members)
  }

  /**
   * Get all members of a set
   * @param key - Set key
   * @returns Promise resolving to array of set members
   */
  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key)
  }

  /**
   * Remove members from a set
   * @param key - Set key
   * @param members - Members to remove
   * @returns Promise resolving to number of members removed
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members)
  }

  /**
   * Check if member exists in set
   * @param key - Set key
   * @param member - Member to check
   * @returns Promise resolving to true if member exists, false otherwise
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member)
    return result === 1
  }

  /**
   * Add element to a list
   * @param key - List key
   * @param element - Element to add
   * @param prepend - Whether to add to the beginning (true) or end (false) of the list
   * @returns Promise resolving to the length of the list after the push operation
   */
  async listAdd(
    key: string,
    element: any,
    prepend: boolean = false,
  ): Promise<number> {
    const stringValue =
      typeof element === 'string' ? element : JSON.stringify(element)

    if (prepend) {
      return this.client.lpush(key, stringValue)
    } else {
      return this.client.rpush(key, stringValue)
    }
  }

  /**
   * Get elements from a list
   * @param key - List key
   * @param start - Start index (default: 0)
   * @param end - End index (default: -1, meaning all elements)
   * @param parse - Whether to parse values as JSON (default: true)
   * @returns Promise resolving to array of list elements
   */
  async listGet<T = any>(
    key: string,
    start: number = 0,
    end: number = -1,
    parse: boolean = true,
  ): Promise<T[]> {
    const result = await this.client.lrange(key, start, end)

    if (!result || result.length === 0) {
      return []
    }

    if (parse) {
      return result.map((item) => {
        try {
          return JSON.parse(item) as T
        } catch (e) {
          return item as unknown as T
        }
      })
    }

    return result as unknown as T[]
  }

  /**
   * Execute a Lua script
   * @param script - Lua script to execute
   * @param keys - Array of keys used in the script
   * @param args - Array of arguments used in the script
   * @returns Promise resolving to the script result
   */
  async eval<T = any>(script: string, keys: string[], args: any[]): Promise<T> {
    return this.client.eval(script, keys.length, ...keys, ...args) as Promise<T>
  }

  /**
   * Flush all data from Redis
   * @returns Promise resolving to "OK" if successful
   */
  async flushAll(): Promise<string> {
    return this.client.flushall()
  }

  /**
   * Flush data from the current database
   * @returns Promise resolving to "OK" if successful
   */
  async flushDb(): Promise<string> {
    return this.client.flushdb()
  }

  /**
   * Ping Redis server
   * @returns Promise resolving to "PONG" if successful
   */
  async ping(): Promise<string> {
    return this.client.ping()
  }

  /**
   * Close Redis connection when module is destroyed
   */
  async onModuleDestroy() {
    if (this.client) {
      this.logger.log('Closing Redis connection')
      await this.client.quit()
    }
  }
}
