# Database Module

This module provides a dynamic database connection system for the application. It currently supports MongoDB through Mongoose with pagination support, and is designed to be extensible for other database types in the future.

## Features

- Dynamic module pattern for flexible configuration
- Connection to MongoDB using environment variables
- Support for registering Mongoose models
- Database service with dynamic model access
- Pagination support through mongoose-paginate-v2
- Extensible design for future database types

## Usage

### Basic Usage

Import the `DbModule` in your application module:

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DbModule } from './modules/db'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DbModule.forRoot(),
  ],
})
export class AppModule {}
```

### Creating a Schema with Pagination

Create a schema with pagination support:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import * as paginate from 'mongoose-paginate-v2'

export type UserDocument = HydratedDocument<User>

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string

  @Prop({ required: true, unique: true })
  email: string
}

export const UserSchema = SchemaFactory.createForClass(User)

// Add pagination plugin to the schema
UserSchema.plugin(paginate)
```

### Registering Models

Register your models in a feature module:

```typescript
import { Module } from '@nestjs/common'
import { DbModule } from 'src/modules/db'
import { User, UserSchema } from './schemas/user.schema'

@Module({
  imports: [
    DbModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
```

### Using the Database Service

Inject the `DbService` in your services and use the `getModel` method to access models:

```typescript
import { Injectable } from '@nestjs/common'
import { DbService } from 'src/modules/db'
import { PaginateModel } from 'mongoose-paginate-v2'
import { User, UserDocument } from './schemas/user.schema'

@Injectable()
export class UserService {
  private userModel: PaginateModel<UserDocument>

  constructor(private readonly dbService: DbService) {
    // Get the User model from the DbService
    this.userModel = this.dbService.getModel<UserDocument>('User') as PaginateModel<UserDocument>
  }

  async findAll(page = 1, limit = 10) {
    return this.userModel.paginate({}, { page, limit })
  }

  async findById(id: string) {
    return this.userModel.findById(id)
  }

  async create(data: Partial<User>) {
    const user = new this.userModel(data)
    return user.save()
  }

  async update(id: string, data: Partial<User>) {
    return this.userModel.findByIdAndUpdate(id, data, { new: true })
  }

  async delete(id: string) {
    return this.userModel.findByIdAndDelete(id)
  }

  isDbConnected(): boolean {
    return this.dbService.isConnected()
  }
}
```

## Environment Variables

The module requires the following environment variables:

- `MONGO_URI`: Primary MongoDB connection URI (e.g., `mongodb://localhost:27017/your-database`)
- `MONGO_URI_SECONDARY`: Secondary MongoDB connection URI (optional)

## How It Works

### DbService

The `DbService` provides a dynamic way to access models without directly injecting them. It uses a model registry and tries multiple ways to get a model:

1. First, it checks if the model is already in the registry
2. If not, it tries to get the model from the NestJS DI container
3. If that fails, it tries to get the model directly from the Mongoose connection

This approach provides several benefits:

- No need to inject models directly into the DbService
- Models can be accessed by name, making the code more flexible
- Services can get models on-demand without complex dependency injection

### DbModule

The `DbModule` provides the following static methods:

- `forRoot()`: Sets up a single database connection and global providers
- `forRootMultipleConnections()`: Sets up multiple database connections and global providers
- `forFeature(models, connectionName)`: Registers Mongoose models for use in a feature module, optionally specifying a connection name
- `forProviders(providers)`: Registers custom database providers for future extensions

### Multiple Connections

To use multiple database connections:

1. Set both `MONGO_URI` and `MONGO_URI_SECONDARY` environment variables
2. Use `DbModule.forRootMultipleConnections()` in your app module
3. When registering models for the secondary connection, specify the connection name:

```typescript
@Module({
  imports: [
    DbModule.forFeature([
      { name: User.name, schema: UserSchema }
    ], 'secondary'),
  ],
  providers: [UserService],
})
export class UserModule {}
```

4. When getting models in your service, specify the connection name:

```typescript
@Injectable()
export class UserService {
  private userModel: Model<UserDocument>

  constructor(private readonly dbService: DbService) {
    this.userModel = this.dbService.getModel<UserDocument>('User', 'secondary')
  }
}
```

## Examples

Check the `examples` directory for complete examples of:

- Schema definition with pagination
- Service implementation using the DbService
- Module configuration

## Future Extensions

The module is designed to be extended to support other database types in the future. To add support for a new database type:

1. Create a new provider in the `providers` directory
2. Update the `DbOptions` interface to include options for the new database type
3. Add a new static method to the `DbModule` class for the new database type
