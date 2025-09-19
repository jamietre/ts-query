import { Join } from "./join.js";
import { Select } from "./select.js";
import { Where, WhereCondition } from "./where.js";

class AliasGenerator {
  private static counter = 0;

  static generate(): string {
    return `t${++this.counter}`;
  }

  static reset(): void {
    this.counter = 0;
  }
}

export interface Query<T extends object> {
  select(fields: Array<keyof T>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(subquery: Query<any>, alias?: string): Select<T>;
  select(fields: Array<keyof T> | Partial<Record<keyof T, string>> | Query<any>, alias?: string): Select<T>;

  join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  where(conditions: WhereCondition<T>): Where<T>;
}

export class BaseQuery<T extends object> implements Query<T> {
  readonly tableName: string;
  readonly tableAlias: string;
  static from<T extends object>(tableName: string, tableAlias?: string) {
    return new BaseQuery<T>(tableName, tableAlias || AliasGenerator.generate());
  }
  constructor(tableName: string, tableAlias?: string) {
    this.tableName = tableName;
    this.tableAlias = tableAlias || AliasGenerator.generate();
  }
  select(fields: Array<keyof T>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(subquery: Query<any>, alias?: string): Select<T>;
  select(fields: Array<keyof T> | Partial<Record<keyof T, string>> | Query<any>, alias?: string): Select<T> {
    return new Select<T>(this, fields, alias);
  }

  join<U extends object>(tableName: string, tableAlias?: string): Join<T, U> {
    const newQuery = new BaseQuery<U>(tableName, tableAlias || AliasGenerator.generate());
    return new Join<T, U>(this, newQuery, 'INNER');
  }

  innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U> {
    return this.join<U>(tableName, tableAlias);
  }

  leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U> {
    const newQuery = new BaseQuery<U>(tableName, tableAlias || AliasGenerator.generate());
    return new Join<T, U>(this, newQuery, 'LEFT');
  }

  where(conditions: WhereCondition<T>): Where<T> {
    return new Where<T>(this, conditions);
  }
}
