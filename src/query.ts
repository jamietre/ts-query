import { Join } from "./join";
import { Select } from "./select";
import { Where, WhereCondition } from "./where";

export interface Query<T extends object> {
  select(fields: Array<keyof T>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(subquery: Query<any>, alias: string): Select<T>;
  select(fields: Array<keyof T> | Partial<Record<keyof T, string>> | Query<any>, alias?: string): Select<T>;

  join<U extends object>(tableName: string, tableAlias: string): Join<T, U>;
  innerJoin<U extends object>(tableName: string, tableAlias: string): Join<T, U>;
  leftJoin<U extends object>(tableName: string, tableAlias: string): Join<T, U>;
  where(conditions: WhereCondition<T>): Where<T>;
}

export class BaseQuery<T extends object> implements Query<T> {
  readonly tableName: string;
  readonly tableAlias: string;
  static from<T extends object>(tableName: string, tableAlias: string) {
    return new BaseQuery<T>(tableName, tableAlias);
  }
  constructor(tableName: string, tableAlias: string) {
    this.tableName = tableName;
    this.tableAlias = tableAlias;
  }
  select(fields: Array<keyof T>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(subquery: Query<any>, alias: string): Select<T>;
  select(fields: Array<keyof T> | Partial<Record<keyof T, string>> | Query<any>, alias?: string): Select<T> {
    return new Select<T>(this, fields, alias);
  }

  join<U extends object>(tableName: string, tableAlias: string): Join<T, U> {
    const newQuery = new BaseQuery<U>(tableName, tableAlias);
    return new Join<T, U>(this, newQuery, 'INNER');
  }

  innerJoin<U extends object>(tableName: string, tableAlias: string): Join<T, U> {
    return this.join<U>(tableName, tableAlias);
  }

  leftJoin<U extends object>(tableName: string, tableAlias: string): Join<T, U> {
    const newQuery = new BaseQuery<U>(tableName, tableAlias);
    return new Join<T, U>(this, newQuery, 'LEFT');
  }

  where(conditions: WhereCondition<T>): Where<T> {
    return new Where<T>(this, conditions);
  }
}
