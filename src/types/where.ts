import { OrderBy, OrderDirection } from "./orderBy.js";
import type { WhereCondition, Queryable, Query } from "./query.js";

export type Condition<T extends object> = {
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

export type OrCondition<T extends object> = {
  type: "or";
  conditions: Condition<T>;
};

export interface Where<T extends object> extends Query<T>, Queryable<T> {
  where(conditions: WhereCondition<T>): Where<T>;
  or(conditions: Condition<T>): Where<T>;
  orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
  limit(count: number, offset?: number): any;
}
