import { QueryBuilder } from "./query.js";
import { JoinBuilder } from "./join.js";
import { SelectBuilder } from "./select.js";
import { WhereBuilder } from "./where.js";
import type { Query, WhereCondition } from "./types/query.js";
import type { Join } from "./types/join.js";
import type { Select } from "./types/select.js";
import type { Where } from "./types/where.js";

export class CompoundQueryBuilder<T extends object, U extends object> implements Query<T & U> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  readonly joinInfo: JoinBuilder<T, U>;
  constructor(query1: Query<T>, query2: Query<U>, join: JoinBuilder<T, U>) {
    this.query1 = query1;
    this.query2 = query2;
    this.joinInfo = join;
  }
  select(fields: Array<keyof T & U>): Select<T & U>;
  select(fields: Partial<Record<keyof T | keyof U, string>>): Select<T & U>;
  select(subquery: Query<any>, alias?: string): Select<T & U>;
  select(fields: Array<keyof T | keyof U> | Partial<Record<keyof T | keyof U, string>> | Query<any>, alias?: string): Select<T & U> {
    return new SelectBuilder<T & U>(this as Query<T & U>, fields, alias);
  }
  join<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V> {
    const newQuery = new QueryBuilder<V>(tableName, tableAlias);
    return new JoinBuilder<T & U, V>(this, newQuery, 'INNER');
  }

  innerJoin<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V> {
    return this.join<V>(tableName, tableAlias);
  }

  leftJoin<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V> {
    const newQuery = new QueryBuilder<V>(tableName, tableAlias);
    return new JoinBuilder<T & U, V>(this, newQuery, 'LEFT');
  }

  where(conditions: WhereCondition<T & U>): Where<T & U> {
    return new WhereBuilder<T & U>(this, conditions);
  }
}
