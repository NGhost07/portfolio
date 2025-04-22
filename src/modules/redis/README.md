# Redis Module

This module provides a Redis client and service for the application, with easy-to-use methods for common Redis operations.

## Features

- Simple connection to Redis using URI from environment variables
- Automatic serialization/deserialization of JSON data
- Support for common Redis operations (get, set, delete, etc.)
- Support for Redis data structures (hashes, sets, lists)
- Connection management and error handling
- Configurable TTL for cached items

## Installation

The module is already installed in the application. It requires the following dependencies:

```bash
npm install ioredis @nestjs/cache-manager cache-manager cache-manager-ioredis
```

## Configuration

The module uses the `REDIS_URI` environment variable for connection. Add this to your `.env` file:

```
REDIS_URI=redis://[[username][:password]@][host][:port][/db-number]
```

Example:
```
REDIS_URI=redis://localhost:6379/0
```

## Usage

### Basic Usage

Import the `RedisModule` in your application module:

```typescript
import { Module } from '@nestjs/common';
import { RedisModule } from './modules/redis';

@Module({
  imports: [
    RedisModule.forRoot(),
  ],
})
export class AppModule {}
```

Then inject the `RedisService` in your services:

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis';

@Injectable()
export class UserService {
  constructor(private readonly redisService: RedisService) {}

  async cacheUser(userId: string, userData: any): Promise<void> {
    await this.redisService.set(`user:${userId}`, userData);
  }

  async getCachedUser(userId: string): Promise<any> {
    return this.redisService.get(`user:${userId}`);
  }
}
```

### Advanced Usage

#### Working with TTL (Time To Live)

```typescript
// Cache data for 5 minutes
await redisService.set('key', value, 300);

// Check remaining TTL
const ttl = await redisService.ttl('key');
```

#### Working with Hashes

```typescript
// Set hash fields
await redisService.hset('user:123', 'name', 'John Doe');
await redisService.hset('user:123', 'email', 'john@example.com');

// Get a specific field
const name = await redisService.hget('user:123', 'name');

// Get all fields
const userData = await redisService.hgetall('user:123');
```

#### Working with Sets

```typescript
// Add members to a set
await redisService.sadd('roles:admin', 'user1', 'user2');

// Check if a member exists in the set
const isAdmin = await redisService.sismember('roles:admin', 'user1');

// Get all members of a set
const admins = await redisService.smembers('roles:admin');
```

#### Working with Lists

```typescript
// Add elements to a list
await redisService.listAdd('notifications', { userId: '123', message: 'New message' });

// Get elements from a list
const notifications = await redisService.listGet('notifications');
```

#### Executing Lua Scripts

```typescript
const script = `
  local current = redis.call('get', KEYS[1])
  if current then
    return current
  else
    redis.call('set', KEYS[1], ARGV[1])
    return ARGV[1]
  end
`;

const result = await redisService.eval(script, ['myKey'], ['defaultValue']);
```

## API Reference

### RedisService

#### Connection Methods

- `getClient()`: Get the Redis client instance
- `isConnected()`: Check if Redis is connected
- `ping()`: Ping the Redis server

#### Key-Value Methods

- `set(key, value, ttl?)`: Set a value with optional TTL
- `get<T>(key, parse?)`: Get a value with optional parsing
- `delete(key)`: Delete a key
- `deleteMany(keys)`: Delete multiple keys
- `exists(key)`: Check if a key exists
- `expire(key, ttl)`: Set key expiration time
- `ttl(key)`: Get key expiration time
- `increment(key, increment?)`: Increment a number
- `decrement(key, decrement?)`: Decrement a number

#### Hash Methods

- `hset(key, field, value)`: Set a hash field
- `hget<T>(key, field, parse?)`: Get a hash field
- `hgetall<T>(key, parse?)`: Get all hash fields
- `hdel(key, field)`: Delete a hash field
- `hexists(key, field)`: Check if a hash field exists

#### Set Methods

- `sadd(key, ...members)`: Add members to a set
- `smembers(key)`: Get all members of a set
- `srem(key, ...members)`: Remove members from a set
- `sismember(key, member)`: Check if a member exists in a set

#### List Methods

- `listAdd(key, element, prepend?)`: Add an element to a list
- `listGet<T>(key, start?, end?, parse?)`: Get elements from a list

#### Other Methods

- `eval<T>(script, keys, args)`: Execute a Lua script
- `flushAll()`: Flush all data from Redis
- `flushDb()`: Flush data from the current database
