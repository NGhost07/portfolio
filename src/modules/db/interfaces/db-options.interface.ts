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
}