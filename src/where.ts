import { QueryBuilder } from "./query.js";
import { SelectBuilder } from "./select.js";
import { JoinBuilder } from "./join.js";
import { LimitBuilder } from "./limit.js";
import { OrderByBuilder } from "./orderBy.js";
import type { Query, WhereCondition, Queryable } from "./types/query.js";
import type { Select } from "./types/select.js";
import type { Join } from "./types/join.js";
import type { Limit } from "./types/limit.js";
import type { Where, Condition, OrCondition } from "./types/where.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";

export class WhereBuilder<T extends object> implements Query<T> {
  readonly query: Query<T>;
  readonly conditions: WhereCondition<T>;
  readonly orConditions: OrCondition<T>[] = [];

  constructor(query: Query<T>, conditions: WhereCondition<T>, orConditions: OrCondition<T>[] = []) {
    this.query = query;
    this.conditions = conditions;
    this.orConditions = orConditions;
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
    if (typeof entity === "string") {
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
    if (typeof entity === "string") {
      const newQuery = new QueryBuilder<U>(entity, alias || AliasGenerator.generate());
      return new JoinBuilder<T, U>(this, newQuery, "LEFT");
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<U>(`(${entity.toString()})`, alias || AliasGenerator.generate());
      return new JoinBuilder<T, U>(this, newQuery, "LEFT");
    }
  }

  where(conditions: WhereCondition<T>): Where<T> {
    // Merge conditions (simple approach - in real implementation might want more sophisticated merging)
    const mergedConditions = { ...this.conditions, ...conditions };
    return new WhereBuilder<T>(this.query, mergedConditions, this.orConditions);
  }

  or(conditions: Condition<T>): Where<T> {
    const orCondition: OrCondition<T> = {
      type: "or",
      conditions,
    };
    const newOrConditions = [...this.orConditions, orCondition];
    return new WhereBuilder<T>(this.query, this.conditions, newOrConditions);
  }

  orderBy(field: keyof T, direction: OrderDirection = "ASC"): OrderBy<T> {
    return new OrderByBuilder<T>(this, field, direction);
  }

  limit(count: number, offset?: number): Limit<T> {
    return new LimitBuilder<T>(this, count, offset);
  }

  toString(): string {
    return this.select(["*" as any]).toString();
  }
}

// Need to import QueryBuilder here to avoid circular dependency
import { AliasGenerator } from "./aliasGenerator.js";
