/**
 * Database connection options interface
 */
export interface DbOptions {
  /**
   * Database connection URI
   */
  uri: string

  /**
   * Additional database connection options
   */
  options?: Record<string, any>

  /**
   * Connection name (optional)
   * Used for multiple connections
   */
  connectionName?: string
}

/**
 * Multiple database connections options interface
 */
export interface MultipleDbOptions {
  /**
   * Primary connection options
   */
  primary: DbOptions

  /**
   * Secondary connections options
   */
  secondary?: DbOptions[]
}
