import { Limit } from "./limit.js";
import { OrderBy, OrderDirection } from "./orderBy.js";
import type { WhereCondition, Queryable, Query, FieldsBase } from "./query.js";

// Treat undefined/null as the same for SQL purposes
type AnyNull<T> = T extends null | undefined ? T | null | undefined : T;

export type Condition<T extends FieldsBase> = {
  [K in keyof T]?:
    | AnyNull<T[K]>
    | { $eq: AnyNull<T[K]> }
    | { $gt: T[K] }
    | { $lt: T[K] }
    | { $gte: T[K] }
    | { $lte: T[K] }
    | { $ne: AnyNull<T[K]> }
    | { $in: T[K][] }
    | { $like: string };
};

export type OrCondition<T extends FieldsBase> = {
  type: "or";
  conditions: Condition<T>;
};

export interface Where<T extends FieldsBase> extends Query<T>, Queryable<T> {
  where(conditions: WhereCondition<T>): Where<T>;
  or(conditions: Condition<T>): Where<T>;
  orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;

  /**
   * Add a limit clause.
   */
  limit(count: number, offset?: number): Limit<T>;
}
