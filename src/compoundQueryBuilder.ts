import { QueryBuilder } from "./queryBuilder.js";
import { JoinBuilder } from "./joinBuilder.js";
import { SelectBuilder } from "./selectBuilder.js";
import { WhereBuilder } from "./whereBuilder.js";
import { OrderByBuilder } from "./orderByBuilder.js";
import { LimitBuilder } from "./limitBuilder.js";
import { AliasGenerator } from "./aliasGenerator.js";
import type { Query, WhereCondition, Queryable, FieldsBase } from "./types/query.js";
import type { Join } from "./types/join.js";
import type { Select } from "./types/select.js";
import type { Where } from "./types/where.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";
import type { Limit } from "./types/limit.js";

type FieldMap<T> = {
  [k: string]: keyof T;
};

export class CompoundQueryBuilder<T extends FieldsBase, U extends FieldsBase> implements Query<T & U> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  readonly joinInfo: JoinBuilder<T, U>;
  readonly joinFieldMapping?: FieldMap<U>; // Store field mappings from join.select()
  private aliasGenerator: AliasGenerator;

  constructor(options: {
    query1: Query<T>;
    query2: Query<U>;
    join: JoinBuilder<T, U>;
    aliasGenerator: AliasGenerator;
    joinFieldMapping?: FieldMap<U>;
  }) {
    this.query1 = options.query1;
    this.query2 = options.query2;
    this.joinInfo = options.join;
    this.joinFieldMapping = options.joinFieldMapping;
    this.aliasGenerator = options.aliasGenerator;
  }
  select(fields: Array<keyof T & U>): Select<T & U>;
  select(fields: Partial<Record<keyof T | keyof U, string>>): Select<T & U>;
  select(fields: Array<keyof T | keyof U> | Partial<Record<keyof T | keyof U, string>>): Select<T & U> {
    return new SelectBuilder<T & U>(this as Query<T & U>, fields);
  }
  join<V extends FieldsBase>(tableName: string | Queryable<V>, tableAlias?: string): Join<T & U, V> {
    if (typeof tableName === "string") {
      const newQuery = new QueryBuilder<V>({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
      return new JoinBuilder<T & U, V>({ query1: this, query2: newQuery, joinType: "INNER" });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<V>({
        tableName: `(${tableName.toString()})`,
        aliasGenerator: this.aliasGenerator,
      });
      return new JoinBuilder<T & U, V>({ query1: this, query2: newQuery, joinType: "INNER" });
    }
  }

  innerJoin<V extends FieldsBase>(tableName: string | Queryable<V>, tableAlias?: string): Join<T & U, V> {
    return this.join<V>(tableName, tableAlias);
  }

  leftJoin<V extends FieldsBase>(tableName: string | Queryable<V>, tableAlias?: string): Join<T & U, V> {
    if (typeof tableName === "string") {
      const newQuery = new QueryBuilder<V>({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
      return new JoinBuilder<T & U, V>({ query1: this, query2: newQuery, joinType: "LEFT" });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<V>({
        tableName: `(${tableName.toString()})`,
        tableAlias: tableAlias,
        aliasGenerator: this.aliasGenerator,
      });
      return new JoinBuilder<T & U, V>({ query1: this, query2: newQuery, joinType: "LEFT" });
    }
  }

  where(conditions: WhereCondition<T & U>): Where<T & U> {
    return new WhereBuilder<T & U>({ query: this, conditions, orConditions: [], aliasGenerator: this.aliasGenerator });
  }

  orderBy(field: keyof (T & U), direction: OrderDirection = "ASC"): OrderBy<T & U> {
    return new OrderByBuilder<T & U>({ query: this, field, direction, aliasGenerator: this.aliasGenerator });
  }

  limit(count: number, offset?: number): Limit<T & U> {
    return new LimitBuilder<T & U>({ query: this, limit: count, offset, aliasGenerator: this.aliasGenerator });
  }

  toString(): string {
    return this.select(["*" as any]).toString();
  }
}
