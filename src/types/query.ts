import { Select } from "./select.js";
import { Join } from "./join.js";
import { Where, Condition } from "./where.js";
import { OrderBy, OrderDirection } from "./orderBy.js";
import { Limit } from "../index.js";

// Base type for query fields that includes "*" for selecting all
export type QueryFieldsBase = { "*": string };

// anything that can start a query
export interface Queryable<T extends QueryFieldsBase> {
  toString(): string;
}

export type AnyQueryable<T extends QueryFieldsBase> = Limit<T> | Where<T> | OrderBy<T> | Select<T> | Join<any, T> | Query<T>;

// A Query represents a table or subquery that can be queried further
// It extends Select to allow starting with SELECT * FROM ...
// It extends Queryable to allow using it as a subquery in joins and selects
export interface Query<T extends QueryFieldsBase> extends Select<T>, Queryable<T> {
  // Join with table name - requires explicit type parameter
  join<U extends QueryFieldsBase>(tableName: string, tableAlias?: string): Join<T, U>;
  innerJoin<U extends QueryFieldsBase>(tableName: string, tableAlias?: string): Join<T, U>;
  leftJoin<U extends QueryFieldsBase>(tableName: string, tableAlias?: string): Join<T, U>;

  // Join with subquery - infers type from queryable
  join<U extends QueryFieldsBase>(subquery: AnyQueryable<U>, alias?: string): Join<T, U>;
  innerJoin<U extends QueryFieldsBase>(subquery: AnyQueryable<U>, alias?: string): Join<T, U>;
  leftJoin<U extends QueryFieldsBase>(subquery: AnyQueryable<U>, alias?: string): Join<T, U>;

  where(conditions: WhereCondition<T>): Where<T>;
  orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
  limit(count: number, offset?: number): Limit<T>;
}

export type WhereCondition<T extends QueryFieldsBase> = Condition<T> & {
  or?: Array<Condition<T>>;
};
