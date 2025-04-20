import { Schema } from 'mongoose'

/**
 * Interface for model definition
 */
export interface ModelDefinition {
  /**
   * Name of the model
   */
  name: string

  /**
   * Schema for the model
   */
  schema: Schema

  /**
   * Collection name (optional)
   */
  collection?: string
}
