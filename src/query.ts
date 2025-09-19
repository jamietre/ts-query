import { JoinBuilder } from "./join.js";
import { SelectBuilder } from "./select.js";
import { WhereBuilder } from "./where.js";
import { OrderByBuilder } from "./orderBy.js";
import { AliasGenerator } from "./aliasGenerator.js";
import type { Query, WhereCondition, Queryable } from "./types/query.js";
import type { Join } from "./types/join.js";
import type { Select } from "./types/select.js";
import type { Where } from "./types/where.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";

export class QueryBuilder<T extends object> implements Query<T> {
  readonly tableName: string;
  readonly tableAlias: string;
  constructor(tableName: string, tableAlias?: string) {
    this.tableName = tableName;
    this.tableAlias = tableAlias || AliasGenerator.generate();
  }
  select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(subquery: Query<any>, alias?: string): Select<T>;
  select(
    fields: Array<keyof T | Partial<Record<keyof T, string>>> | Partial<Record<keyof T, string>> | Query<any>,
    alias?: string,
  ): Select<T> {
    return new SelectBuilder<T>(this, fields);
  }

  join<U extends object>(entity: string | Queryable<U>, alias?: string): Join<T, U> {
    if (typeof entity === 'string') {
      const newQuery = new QueryBuilder<U>(entity, alias || AliasGenerator.generate());
      return new JoinBuilder<T, U>(this, newQuery, "INNER");
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<U>(`(${entity.toString()})`, alias || AliasGenerator.generate());
      return new JoinBuilder<T, U>(this, newQuery, "INNER");
    }
  }

  innerJoin<U extends object>(entity: string | Queryable<U>, alias?: string): Join<T, U> {
    return this.join<U>(entity, alias);
  }

  leftJoin<U extends object>(entity: string | Queryable<U>, alias?: string): Join<T, U> {
    if (typeof entity === 'string') {
      const newQuery = new QueryBuilder<U>(entity, alias || AliasGenerator.generate());
      return new JoinBuilder<T, U>(this, newQuery, "LEFT");
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<U>(`(${entity.toString()})`, alias || AliasGenerator.generate());
      return new JoinBuilder<T, U>(this, newQuery, "LEFT");
    }
  }

  where(conditions: WhereCondition<T>): Where<T> {
    return new WhereBuilder<T>(this, conditions);
  }

  orderBy(field: keyof T, direction: OrderDirection = "ASC"): OrderBy<T> {
    return new OrderByBuilder<T>(this, field, direction);
  }

  toString(): string {
    return this.select(['*' as any]).toString();
  }
}
