export interface RedisModuleOptions {
  /**
   * Redis connection URI
   * Format: redis://[[username][:password]@][host][:port][/db-number]
   * Example: redis://user:password@localhost:6379/0
   */
  uri?: string

  /**
   * Redis connection options
   */
  connectionOptions?: {
    host?: string

    port?: number

    username?: string

    password?: string

    db?: number

    connectTimeout?: number

    retryStrategy?: (times: number) => number | void | null

    maxRetriesPerRequest?: number

    tls?: boolean
  }

  defaultTTL?: number

  isGlobal?: boolean
}
