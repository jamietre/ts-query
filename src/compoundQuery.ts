import { BaseQuery, Query } from "./query.js";
import { Join } from "./join.js";
import { Select } from "./select.js";
import { Where, WhereCondition } from "./where.js";

export class CompoundQuery<T extends object, U extends object> implements Query<T & U> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  readonly joinInfo: Join<T, U>;
  constructor(query1: Query<T>, query2: Query<U>, join: Join<T, U>) {
    this.query1 = query1;
    this.query2 = query2;
    this.joinInfo = join;
  }
  select(fields: Array<keyof T & U>): Select<T & U>;
  select(fields: Partial<Record<keyof T | keyof U, string>>): Select<T & U>;
  select(subquery: Query<any>, alias?: string): Select<T & U>;
  select(fields: Array<keyof T | keyof U> | Partial<Record<keyof T | keyof U, string>> | Query<any>, alias?: string): Select<T & U> {
    return new Select<T & U>(this as Query<T & U>, fields, alias);
  }
  join<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V> {
    const newQuery = new BaseQuery<V>(tableName, tableAlias);
    return new Join<T & U, V>(this, newQuery, 'INNER');
  }

  innerJoin<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V> {
    return this.join<V>(tableName, tableAlias);
  }

  leftJoin<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V> {
    const newQuery = new BaseQuery<V>(tableName, tableAlias);
    return new Join<T & U, V>(this, newQuery, 'LEFT');
  }

  where(conditions: WhereCondition<T & U>): Where<T & U> {
    return new Where<T & U>(this, conditions);
  }
}
