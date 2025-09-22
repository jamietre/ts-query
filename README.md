# ts-query - Typed query builder

## Why

There are a number of query builders out there, but they all have one thing in common: they're tightly coupled with a database connection library, or
heavy type structure that requires creating entity definitions. I want a query builder that has no coupling with anything. You can provide your own
types for every query, and it will infer usage as you build it up. This works great with zod, too, and you can use zod to verify that the results of your
query are as expected if you want.

# Features

Supports making SELECT queries.

- **Zero Dependencies** - No external dependencies, pure TypeScript
- **Database Agnostic** - Works with any database connection library (pg, mysql2, sqlite3, etc.)
- **Full Type Safety** - TypeScript interfaces with complete IntelliSense support
- **Fluent API** - Chainable methods for readable query building
- **Explicit Table Aliases** - Type-safe table aliases with dot notation field references
- **Advanced Conditions** - Rich where clause builder with operators ($gt, $lt, $in, $like, etc.)
- **Null/Undefined Handling** - Proper SQL NULL handling (IS NULL, IS NOT NULL)
- **OR Logic Support** - Both inline `or: [...]` syntax and chained `.or()` methods
- **Join Operations** - INNER and LEFT joins with type-safe field mapping
- **Ordering & Pagination** - ORDER BY clauses with multiple fields and LIMIT/OFFSET
- **Subquery Support** - Full subquery support as table sources
- **Standard SQL Output** - Generates clean, readable SQL compatible with most databases


# Limitations

There are many, but for a lot of use cases involving SELECT queries it should work well. 

- Using functions or selecting anything that's not a known field from your input types is supported with `selectAny`. Hope to improve this in the future to support templating of actual field names within known functions
- You can't use CASE as part of anything but a select; make this allowable for ORDER BY, etc



# Roadmap

- Add support for INSERT, UPDATE, DELETE, UNION, GROUP BY, HAVING, etc
- Add support for functions using templated strings
- Dig into the AI generated code and look for improvement opportunities
- Organize tests better; make specs; remove repetition

# Usage

## Basic Query Building

- Query building has complete type safety for fields used in query clauses

```typescript
import { queryBuilder } from 'ts-query';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}


// Simple query using User as schema
const sql2 = queryBuilder
  .from<User>("users")
  .select(["id", "name", "email"])
  .toString();
// SELECT id, name, email FROM users


// Optional syntax to include a table alias
const sql = queryBuilder
  .from<User, "u">("users", "u")
  .select(["u.id", "u.name", "u.email"])
  .toString();
// SELECT u.id, u.name, u.email FROM users u
```

## Field Aliasing

- Field names can be aliased, and types of new field names are propagated to subsequent clauses


```typescript
// Select with field aliases
const sql = queryBuilder
  .from<User,>("users")
  .select({
    "id": "user_id",
    "name": "full_name",
    "email": "email_address"
  })
  .toString();
// SELECT d AS user_id, name AS full_name, email AS email_address FROM users

// Mixed array and object selection
const sql2 = queryBuilder
  .from<User>("users")
  .select([
    "id",
    { "name": "full_name" },
    "email"
  ])
  .toString();
// SELECT u.id, u.name AS full_name, u.email FROM users u
```

## Where Conditions

- Support for all boolean operations, LIKE, IN
- Can build complex nested conditions with simple syntax


### Supported Operators

- `$eq`: Equal to (handles null as IS NULL)
- `$gt`: Greater than
- `$lt`: Less than
- `$gte`: Greater than or equal
- `$lte`: Less than or equal
- `$ne`: Not equal (handles null as IS NOT NULL)
- `$in`: In array
- `$like`: Like pattern


```typescript
// Simple conditions with dot notation
const sql = queryBuilder
  .from<User>("users")
  .where({ "age": 25, "name": "John" })
  .select(["id", "name"])
  .toString();
// SELECT id, name FROM users WHERE age = 25 AND name = 'John'

// Operator conditions
const sql2 = queryBuilder
  .from<User>("users")
  .where({
    "age": { $gt: 18 },
    "name": { $like: "John%" }
  })
  .select(["id", "name"])
  .toString();
// SELECT id, name FROM users WHERE age > 18 AND name LIKE 'John%'

// Null handling
const sql3 = queryBuilder
  .from<User>("users")
  .where({
    "email": null,  // IS NULL
    "name": { $ne: null }  // IS NOT NULL
  })
  .select(["id"])
  .toString();
// SELECT id FROM users WHERE email IS NULL AND name IS NOT NULL
```

## OR Conditions

```typescript
// Inline OR conditions
const sql = queryBuilder
  .from<User>("users")
  .where({
    "age": { $gt: 65 },
    or: [
      { "name": "John" },
      { "email": { $like: "%@admin.com" } }
    ]
  })
  .select(["id", "name"])
  .toString();
// SELECT id, name FROM users WHERE age > 65 AND (name = 'John' OR email LIKE '%@admin.com')

// Chained OR conditions
const sql2 = queryBuilder
  .from<User>("users")
  .where({ "age": { $gt: 18 } })
  .or({ "name": "John" })
  .or({ "email": { $like: "%@vip.com" } })
  .select(["id", "u.name"])
  .toString();
// SELECT id, name FROM users WHERE age > 18 OR name = 'John' OR u.email LIKE '%@vip.com'
```

## Joins

- Support for strongly-type aliasing of joined tables and fields
- Can join against subqueries


```typescript
interface Post {
  id: number;
  title: string;
  user_id: number;
  content: string;
}

// Inner join with explicit aliases
const sql = queryBuilder
  .from<User, "u">("users", "u")
  .innerJoin<Post, "p">("posts", "p")
  .on({ "u.id": "p.user_id" })
  .select(["u.name", "p.title"])
  .toString();
// SELECT u.name, p.title FROM users u INNER JOIN posts p ON u.id = p.user_id

// Left join with where conditions
const sql2 = queryBuilder
  .from<User, "u">("users", "u")
  .leftJoin<Post, "p">("posts", "p")
  .on({ "u.id": "p.user_id" })
  .where({ "u.age": { $gt: 18 } })
  .select({
    "u.name": "user_name",
    "p.title": "post_title"
  })
  .toString();
// SELECT u.name AS user_name, p.title AS post_title FROM users u LEFT JOIN posts p ON u.id = p.user_id WHERE u.age > 18
```

## Order By

```typescript
// Single order by
const sql = queryBuilder
  .from<User, "u">("users", "u")
  .orderBy("u.age", "DESC")
  .select(["u.name", "u.age"])
  .toString();
// SELECT u.name, u.age FROM users u ORDER BY u.age DESC

// Multiple order by fields (chained)
const sql2 = queryBuilder
  .from<User, "u">("users", "u")
  .orderBy("u.age", "DESC")
  .orderBy("u.name", "ASC")
  .select(["u.name", "u.age"])
  .toString();
// SELECT u.name, u.age FROM users u ORDER BY u.age DESC, u.name ASC

// Order by with where conditions
const sql3 = queryBuilder
  .from<User, "u">("users", "u")
  .where({ "u.age": { $gt: 18 } })
  .orderBy("u.name", "ASC")
  .select(["u.name", "u.age"])
  .toString();
// SELECT u.name, u.age FROM users u WHERE u.age > 18 ORDER BY u.name ASC
```

## Limit and Offset

```typescript
// Simple limit
const sql = queryBuilder
  .from<User>("users")
  .where({ "age": { $gt: 18 } })
  .limit(10)
  .select(["name", "email"])
  .toString();
// SELECT name, email FROM users u WHERE age > 18 LIMIT 10

// Limit with offset
const sql2 = queryBuilder
  .from<User>("users")
  .orderBy("id", "ASC")
  .limit(10, 20)
  .select(["name", "email"])
  .toString();
// SELECT name, email FROM users ORDER BY id ASC LIMIT 10 OFFSET 20

// Chained offset
const sql3 = queryBuilder
  .from<User>("users")
  .limit(10)
  .offset(30)
  .select(["name", "email"])
  .toString();
// SELECT name, email FROM users LIMIT 10 OFFSET 30
```

## Subqueries

```typescript
// Subquery as table source
const subquery = queryBuilder
  .from<User>("users")
  .where({ age: { $gt: 18 } });

const sql = queryBuilder
  .from(subquery, "adult_users")
  .select(["adult_users.name", "adult_users.email"])
  .toString();
// SELECT adult_users.name, adult_users.email FROM (SELECT * FROM users WHERE age > 18) AS adult_users


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

const sql = queryBuilder
  .from<User, "u">("users", "u")
  .leftJoin<Department, "d">("departments", "d")
  .on({ "u.department_id": "d.id" })
  .where({
    "u.age": { $gte: 21 },
    or: [
      { "u.email": { $like: "%@company.com" } },
      { "d.budget": { $gt: 100000 } }
    ]
  })
  .orderBy("u.age", "DESC")
  .orderBy("u.name", "ASC")
  .select({
    "u.id": "user_id",
    "u.name": "full_name",
    "d.name": "dept_name"
  })
  .limit(20, 10)
  .toString();
// SELECT u.id AS user_id, u.name AS full_name, d.name AS dept_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.age >= 21 OR u.email LIKE '%@company.com' OR d.budget > 100000 ORDER BY u.age DESC, u.name ASC LIMIT 20 OFFSET 10;
```

## Type Safety

The query builder provides full TypeScript type safety with explicit table aliases:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const sql = queryBuilder
  .from<User, "u">("users", "u")
  .where({
    // ✅ Valid - 'u.name' uses correct table alias and field
    "u.name": "John",
    // ❌ TypeScript error - 'u.invalid_field' doesn't exist on User
    "u.invalid_field": "value"
  })
  .orderBy("u.name", "ASC")  // ✅ Valid field with alias
  .select(["u.id", "u.email"]); // ✅ Valid fields with alias

// Without table alias - fields don't need prefixes
const sql2 = queryBuilder
  .from<User>("users")
  .where({
    name: "John",  // ✅ Valid - no table alias needed
    age: { $gt: 18 }
  })
  .select(["id", "name"]);
```

## Star Selection

```typescript
// Select all fields
const sql = queryBuilder
  .from<User, "u">("users", "u")
  .select(["*"])
  .toString();
// SELECT * FROM users u

// Mix star with specific fields
const sql2 = queryBuilder
  .from<User>("users")
  .select(["*", "id"])
  .toString();
// SELECT *, id FROM users
```