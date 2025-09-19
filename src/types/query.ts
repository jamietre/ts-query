import { Select } from "./select.js";
import { Join } from "./join.js";
import { Where, Condition } from "./where.js";
import { OrderBy, OrderDirection } from "./orderBy.js";

export interface Selectable<T extends object> {
  select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(subquery: Query<any>, alias?: string): Select<T>;
  select(
    fields: Array<keyof T | Partial<Record<keyof T, string>>> | Partial<Record<keyof T, string>> | Query<any>,
    alias?: string,
  ): Select<T>;
}

export interface Query<T extends object> extends Selectable<T> {
  join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  where(conditions: WhereCondition<T>): Where<T>;
  orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
}

export type WhereCondition<T extends object> = Condition<T> & {
  or?: Array<Condition<T>>;
};

