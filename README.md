# ts-query - Typed query builder

## Why

There are a number of query builders out there, but they all have one thing in common: they're tightly coupled with a database connection library, or 
heavy type structure that requires creating entity defintions. I want a query builder that has no coupling with anything. You can provide your own
types for every query, and it will infer usage as you build it up. This works great with zod, too, and you can use zod to verify that the results of your
query are as expected if you want.

# Features

- **Zero Dependencies** - No external dependencies, pure TypeScript
- **Database Agnostic** - Works with any database connection library (pg, mysql2, sqlite3, etc.)
- **Full Type Safety** - TypeScript interfaces with complete IntelliSense support
- **Fluent API** - Chainable methods for readable query building
- **Flexible Aliasing** - Automatic table aliases or specify your own
- **Advanced Conditions** - Rich where clause builder with operators ($gt, $lt, $in, $like, etc.)
- **OR Logic Support** - Both inline `or: [...]` syntax and chained `.or()` methods
- **Join Operations** - INNER and LEFT joins with type-safe field mapping
- **Ordering & Pagination** - ORDER BY clauses with multiple fields and LIMIT/OFFSET
- **Subquery Support** - Embed subqueries in SELECT statements
- **Standard SQL Output** - Generates clean, readable SQL compatible with most databases


# Usage

## Basic Query Building

```typescript
import { query } from 'ts-query';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Basic select
const sql = query.from<User>('users')
  .select(['id', 'name', 'email'])
  .toString();
// SELECT id, name, email FROM users AS t1
```

## Field Aliasing

```typescript
// Select with field aliases
const sql = query.from<User>('users')
  .select({
    user_id: 'id',
    full_name: 'name',
    email_address: 'email'
  })
  .toString();
// SELECT id AS user_id, name AS full_name, email AS email_address FROM users AS t1
```

## Where Conditions

```typescript
// Simple conditions
const sql = query.from<User>('users')
  .where({ age: 25, name: 'John' })
  .select(['id', 'name'])
  .toString();
// SELECT id, name FROM users AS t1 WHERE t1.age = 25 AND t1.name = 'John'

// Operator conditions
const sql2 = query.from<User>('users')
  .where({
    age: { $gt: 18 },
    name: { $like: 'John%' }
  })
  .select(['id', 'name'])
  .toString();
// SELECT id, name FROM users AS t1 WHERE t1.age > 18 AND t1.name LIKE 'John%'
```

### Supported Operators

- `$eq`: Equal to
- `$gt`: Greater than
- `$lt`: Less than
- `$gte`: Greater than or equal
- `$lte`: Less than or equal
- `$ne`: Not equal
- `$in`: In array
- `$like`: Like pattern

## OR Conditions

```typescript
// Inline OR conditions
const sql = query.from<User>('users')
  .where({
    age: { $gt: 65 },
    or: [
      { name: 'John' },
      { email: { $like: '%@admin.com' } }
    ]
  })
  .select(['id', 'name'])
  .toString();

// Chained OR conditions
const sql2 = query.from<User>('users')
  .where({ age: { $gt: 18 } })
  .or({ name: 'John' })
  .or({ email: { $like: '%@vip.com' } })
  .select(['id', 'name'])
  .toString();
```

## Joins

```typescript
interface Post {
  id: number;
  title: string;
  user_id: number;
  content: string;
}

// Inner join
const sql = query.from<User>('users')
  .join<Post>('posts')
  .on({ id: 'user_id' })
  .select(['name', 'title'])
  .toString();
// SELECT name, title FROM users AS t1 INNER JOIN posts AS t2 ON t1.id = t2.user_id

// Left join with where
const sql2 = query.from<User>('users')
  .leftJoin<Post>('posts')
  .on({ id: 'user_id' })
  .where({ age: { $gt: 18 } })
  .select(['name', 'title'])
  .toString();
```

## Order By

```typescript
// Single order by
const sql = query.from<User>('users')
  .orderBy('age', 'DESC')
  .select(['name', 'age'])
  .toString();
// SELECT name, age FROM users AS t1 ORDER BY t1.age DESC

// Multiple order by fields
const sql2 = query.from<User>('users')
  .orderBy('age', 'DESC')
  .orderBy('name', 'ASC')
  .select(['name', 'age'])
  .toString();
// SELECT name, age FROM users AS t1 ORDER BY t1.age DESC, t1.name ASC

// Order by after where
const sql3 = query.from<User>('users')
  .where({ age: { $gt: 18 } })
  .orderBy('name', 'ASC')
  .select(['name', 'age'])
  .toString();
// SELECT name, age FROM users AS t1 WHERE t1.age > 18 ORDER BY t1.name ASC
```

## Limit and Offset

```typescript
// Simple limit
const sql = query.from<User>('users')
  .select(['name', 'email'])
  .limit(10)
  .toString();
// SELECT name, email FROM users AS t1 LIMIT 10

// Limit with offset
const sql2 = query.from<User>('users')
  .orderBy('id', 'ASC')
  .select(['name', 'email'])
  .limit(10, 20)
  .toString();
// SELECT name, email FROM users AS t1 ORDER BY t1.id ASC LIMIT 10 OFFSET 20

// Pagination
const sql3 = query.from<User>('users')
  .select(['name', 'email'])
  .limit(10)
  .offset(30)
  .toString();
// SELECT name, email FROM users AS t1 LIMIT 10 OFFSET 30
```

## Subqueries

```typescript
// Subquery in select
const subquery = query.from<Post>('posts')
  .where({ user_id: { $eq: 1 } });

const sql = query.from<User>('users')
  .select(subquery, 'user_posts')
  .toString();
// SELECT (SELECT * FROM posts AS s1 WHERE s1.user_id = 1) AS user_posts FROM users AS t1
```

## Complex Example

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  department_id: number;
}

interface Department {
  id: number;
  name: string;
  budget: number;
}

const sql = query.from<User>('users', 'u')
  .leftJoin<Department>('departments', 'd')
  .on({ department_id: 'id' })
  .where({
    age: { $gte: 21 },
    or: [
      { 'u.email': { $like: '%@company.com' } },
      { 'd.budget': { $gt: 100000 } }
    ]
  })
  .orderBy('age', 'DESC')
  .orderBy('name', 'ASC')
  .select({
    user_id: 'u.id',
    full_name: 'u.name',
    dept_name: 'd.name'
  })
  .limit(20, 10)
  .toString();
```

## Type Safety

The query builder provides full TypeScript type safety:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const sql = query.from<User>('users')
  .where({
    // ✅ Valid - 'name' exists on User
    name: 'John',
    // ❌ TypeScript error - 'invalid_field' doesn't exist on User
    invalid_field: 'value'
  })
  .orderBy('name', 'ASC')  // ✅ Valid field
  .select(['id', 'email']); // ✅ Valid fields
```