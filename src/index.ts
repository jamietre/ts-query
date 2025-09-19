// Main entry point for ts-query package
import { AliasGenerator } from "./aliasGenerator.js";
import { QueryBuilder } from "./query.js";
import { Limit } from "./types/limit.js";
import { OrderBy } from "./types/orderBy.js";
import type { AnyQueryable, Query, Queryable } from "./types/query.js";
import { Where } from "./types/where.js";

// Create proper overloaded from function
// The overload for inferring from Queryable<T> must specify the actual types exposed, or inference of the generic
// type will not work correctly and T is always returned as "object"
// It seems OK to use Queryable<T> in the actual signature.
function from<T extends object>(tableName: string, alias?: string): Query<T>;
function from<T extends object>(subquery: AnyQueryable<T>, alias2?: string): Query<T>;
function from<T extends object>(entity: string | Queryable<T>, alias?: string): Query<T> {
  if (typeof entity === "string") {
    return new QueryBuilder<T>(entity, alias || AliasGenerator.generate());
  } else {
    // Handle subquery case - create a QueryBuilder that wraps the subquery
    return new QueryBuilder<T>(`(${entity.toString()})`, alias || AliasGenerator.generate());
  }
}

// Create the main query API
export const queryBuilder = {
  from,
};

// Only export interfaces as the main public API
export type { Query, WhereCondition } from "./types/query.js";
export type { Join, JoinType } from "./types/join.js";
export type { Select } from "./types/select.js";
export type { Where, OrCondition, Condition } from "./types/where.js";
export type { Limit } from "./types/limit.js";
export type { OrderBy, OrderDirection } from "./types/orderBy.js";
