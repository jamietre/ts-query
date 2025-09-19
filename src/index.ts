// Main entry point for ts-query package
import { AliasGenerator } from "./aliasGenerator.js";
import { QueryBuilder } from "./query.js";
import type { Query, Queryable } from "./types/query.js";

// Type helper to infer T from Queryable implementations
type InferQueryableType<T> = T extends Queryable<infer U> ? U : never;

// Create proper overloaded from function
function from<T extends object>(tableName: string, alias?: string): Query<T>;
function from<T extends object, Q extends Queryable<T>>(subquery: Q, alias2?: string): Query<T>;
function from<T extends object>(entity: string | Queryable<T>, alias?: string): Query<T> {
  if (typeof entity === "string") {
    return new QueryBuilder<T>(entity, alias || AliasGenerator.generate());
  } else {
    // Handle subquery case - create a QueryBuilder that wraps the subquery
    return new QueryBuilder<T>(`(${entity.toString()})`, alias || AliasGenerator.generate()) as any;
  }
}

function from2<Q extends Queryable<any>>(subquery: Q, alias?: string): Query<InferQueryableType<Q>> {
  return new QueryBuilder<InferQueryableType<Q>>(`(${subquery.toString()})`, alias || AliasGenerator.generate());
}

// Create the main query API
export const queryBuilder = {
  from,
  from2,
};

// Only export interfaces as the main public API
export type { Query, WhereCondition } from "./types/query.js";
export type { Join, JoinType } from "./types/join.js";
export type { Select } from "./types/select.js";
export type { Where, OrCondition, Condition } from "./types/where.js";
export type { Limit } from "./types/limit.js";
export type { OrderBy, OrderDirection } from "./types/orderBy.js";
