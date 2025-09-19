import { Limit } from "./limit.js";
import { OrderBy, OrderDirection } from "./orderBy.js";
import type { WhereCondition, Queryable, Query, QueryFieldsBase } from "./query.js";

export type Condition<T extends QueryFieldsBase> = {
  [K in keyof T]?:
    | T[K]
    | { $eq: T[K] }
    | { $gt: T[K] }
    | { $lt: T[K] }
    | { $gte: T[K] }
    | { $lte: T[K] }
    | { $ne: T[K] }
    | { $in: T[K][] }
    | { $like: string };
};

export type OrCondition<T extends QueryFieldsBase> = {
  type: "or";
  conditions: Condition<T>;
};

export interface Where<T extends QueryFieldsBase> extends Query<T>, Queryable<T> {
  where(conditions: WhereCondition<T>): Where<T>;
  or(conditions: Condition<T>): Where<T>;
  orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;

  /**
   * Add a limit clause.
   */
  limit(count: number, offset?: number): Limit<T>;
}
