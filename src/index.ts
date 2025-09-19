// Main entry point for ts-query package
import { AliasGenerator } from "./aliasGenerator.js";
import { QueryBuilder } from "./query.js";
import type { Query } from "./types/query.js";

// Create the main query API
export const queryBuilder = {
  from<T extends object>(tableName: string, tableAlias?: string): Query<T> {
    return new QueryBuilder<T>(tableName, tableAlias || AliasGenerator.generate());
  },
};

// Export QueryBuilder for internal/testing use, but don't advertise it
export { QueryBuilder };

// Only export interfaces as the main public API
export type { Query, WhereCondition } from "./types/query.js";
export type { Join, JoinType } from "./types/join.js";
export type { Select } from "./types/select.js";
export type { Where, OrCondition, Condition } from "./types/where.js";
export type { Limit } from "./types/limit.js";
export type { OrderBy, OrderDirection } from "./types/orderBy.js";
