# Database Module

This module provides a dynamic database connection system for the application. It currently supports MongoDB through Mongoose with pagination support, and is designed to be extensible for other database types in the future.

## Features

- Dynamic module pattern for flexible configuration
- Connection to MongoDB using environment variables
- Support for registering Mongoose models
- Database service for direct access to all models
- Pagination support through mongoose-paginate-v2
- Extensible design for future database types

## Usage

### Basic Usage

Import the `DbModule` in your application module:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './modules/db';

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

### Using with Models

To use the module with Mongoose models:

```typescript
import { Module } from '@nestjs/common';
import { DbModule } from '../db';
import { Example, ExampleSchema } from './schemas/example.schema';

@Module({
  imports: [
    DbModule.forFeature([
      { name: Example.name, schema: ExampleSchema },
    ]),
  ],
  providers: [YourService],
  controllers: [YourController],
})
export class YourModule {}
```

### Using the Database Service

Inject the `DbService` in your services to access models directly:

```typescript
import { Injectable } from '@nestjs/common';
import { DbService } from '../db';

@Injectable()
export class YourService {
  constructor(private readonly dbService: DbService) {}

  async findAll() {
    // Access the example model directly through DbService
    return this.dbService.example.find();
  }

  async findWithPagination(page = 1, limit = 10) {
    // Use pagination
    return this.dbService.example.paginate({}, { page, limit });
  }

  isDbConnected(): boolean {
    return this.dbService.isConnected();
  }
}
```

## Environment Variables

The module requires the following environment variables:

- `MONGO_URI`: MongoDB connection URI (e.g., `mongodb://localhost:27017/your-database`)

## Adding New Models

To add a new model to the DbService:

1. Create a new schema in the `schemas` directory
2. Add the pagination plugin to the schema
3. Register the schema in `DbModule.forRoot()`
4. Add a new property in `DbService`
5. Inject the model into the `DbService` constructor

Example:

```typescript
// 1. Create a new schema
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string
}

export const UserSchema = SchemaFactory.createForClass(User)
UserSchema.plugin(mongoosePaginate)

// 2. Register in DbModule
MongooseModule.forFeature([
  { name: Example.name, schema: ExampleSchema },
  { name: User.name, schema: UserSchema }, // Add new model
]),

// 3. Update DbService
export class DbService implements OnApplicationBootstrap {
  example: PaginateModel<Example>
  user: PaginateModel<User> // Add new property

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Example.name) private exampleModel: PaginateModel<Example>,
    @InjectModel(User.name) private userModel: PaginateModel<User>, // Inject new model
  ) {
    this.example = exampleModel
    this.user = userModel // Initialize property
  }
}
```

## Future Extensions

The module is designed to be extended to support other database types in the future. To add support for a new database type:

1. Create a new provider in the `providers` directory
2. Update the `DbOptions` interface to include options for the new database type
3. Add a new static method to the `DbModule` class for the new database type
