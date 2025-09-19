import { QueryBuilder } from "./query.js";
import { SelectBuilder } from "./select.js";
import { JoinBuilder } from "./join.js";
import { LimitBuilder } from "./limit.js";
import { OrderByBuilder } from "./orderBy.js";
import type { Query, WhereCondition, Queryable, QueryFieldsBase } from "./types/query.js";
import type { Select } from "./types/select.js";
import type { Join } from "./types/join.js";
import type { Limit } from "./types/limit.js";
import type { Where, Condition, OrCondition } from "./types/where.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";

export class WhereBuilder<T extends QueryFieldsBase> implements Where<T> {
  readonly query: Query<T>;
  readonly conditions: WhereCondition<T>;
  readonly orConditions: OrCondition<T>[] = [];
  readonly aliasGenerator: AliasGenerator;

  constructor(options: {
    aliasGenerator: AliasGenerator;
    query: Query<T>;
    conditions: WhereCondition<T>;
    orConditions: OrCondition<T>[];
  }) {
    this.query = options.query;
    this.conditions = options.conditions;
    this.orConditions = options.orConditions;
    this.aliasGenerator = options.aliasGenerator;
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

  join<U extends QueryFieldsBase>(tableName: string | Queryable<U>, tableAlias?: string): Join<T, U> {
    if (typeof tableName === "string") {
      const newQuery = new QueryBuilder<U>({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "INNER" });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<U>({
        tableName: `(${tableName.toString()})`,
        tableAlias,
        aliasGenerator: this.aliasGenerator,
      });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "INNER" });
    }
  }

  innerJoin<U extends QueryFieldsBase>(entity: string | Queryable<U>, alias?: string): Join<T, U> {
    return this.join<U>(entity, alias);
  }

  leftJoin<U extends QueryFieldsBase>(entity: string | Queryable<U>, alias?: string): Join<T, U> {
    if (typeof entity === "string") {
      const newQuery = new QueryBuilder<U>({
        tableName: entity,
        tableAlias: alias || new AliasGenerator().generate(),
        aliasGenerator: this.aliasGenerator,
      });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "LEFT" });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<U>({
        tableName: `(${entity.toString()})`,
        tableAlias: alias || new AliasGenerator().generate(),
        aliasGenerator: this.aliasGenerator,
      });
      return new JoinBuilder<T, U>({
        query1: this,
        query2: newQuery,
        joinType: "LEFT",
        aliasGenerator: this.aliasGenerator,
      });
    }
  }

  where(conditions: WhereCondition<T>): Where<T> {
    // Merge conditions (simple approach - in real implementation might want more sophisticated merging)
    const mergedConditions = { ...this.conditions, ...conditions };
    return new WhereBuilder<T>({
      query: this.query,
      conditions: mergedConditions,
      orConditions: this.orConditions,
      aliasGenerator: this.aliasGenerator,
    });
  }

  or(conditions: Condition<T>): Where<T> {
    const orCondition: OrCondition<T> = {
      type: "or",
      conditions,
    };
    const newOrConditions = [...this.orConditions, orCondition];
    return new WhereBuilder<T>({
      query: this.query,
      conditions: this.conditions,
      orConditions: newOrConditions,
      aliasGenerator: this.aliasGenerator,
    });
  }

  orderBy(field: keyof T, direction: OrderDirection = "ASC"): OrderBy<T> {
    return new OrderByBuilder<T>({ query: this, field, direction, aliasGenerator: this.aliasGenerator });
  }

  limit(count: number, offset?: number): Limit<T> {
    return new LimitBuilder<T>({ query: this, limit: count, offset, aliasGenerator: this.aliasGenerator });
  }

  toString(): string {
    return this.select(["*"]).toString();
  }
}

// Need to import QueryBuilder here to avoid circular dependency
import { AliasGenerator } from "./aliasGenerator.js";
