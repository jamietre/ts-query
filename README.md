# ts-query - Typed query builder

## Why

There are a number of query builders out there, but they all have one thing in common: they're tightly coupled with a database connection library, or 
heavy type structure that requires creating entity defintions. I want a query builder that has no coupling with anything. You can provide your own
types for every query, and it will infer usage as you build it up. This works great with zod, too, and you can use zod to verify that the results of your
query are as expected if you want.

# Features

- No dependencies
- Use with any database connection library
- Use with any databse that supports standard sql (todo - implement variants for engine-specific things like LIMIT)

[todo]

# Usage

[todo]