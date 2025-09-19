import { Select } from "./select.js";
import { Join } from "./join.js";
import { Where, Condition } from "./where.js";
import { OrderBy, OrderDirection } from "./orderBy.js";

// anything that can start a query
export interface Queryable<T extends object> {
  toString(): string;
}
export interface Query<T extends object> extends Select<T> {
  // Join with table name - requires explicit type parameter
  join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;

  // Join with subquery - infers type from queryable
  join<U extends object>(subquery: Queryable<U>, alias?: string): Join<T, U>;
  innerJoin<U extends object>(subquery: Queryable<U>, alias?: string): Join<T, U>;
  leftJoin<U extends object>(subquery: Queryable<U>, alias?: string): Join<T, U>;

  where(conditions: WhereCondition<T>): Where<T>;
  orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
}

export type WhereCondition<T extends object> = Condition<T> & {
  or?: Array<Condition<T>>;
};
