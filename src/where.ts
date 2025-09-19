import { QueryBuilder } from "./query.js";
import { SelectBuilder } from "./select.js";
import { JoinBuilder } from "./join.js";
import { LimitBuilder } from "./limit.js";
import type { Query } from "./types/query.js";
import type { Select } from "./types/select.js";
import type { Join } from "./types/join.js";
import type { Limit } from "./types/limit.js";
import type { Where } from "./types/where.js";

type Condition<T extends object> = {
  [K in keyof T]?: T[K] | { $eq: T[K] } | { $gt: T[K] } | { $lt: T[K] } | { $gte: T[K] } | { $lte: T[K] } | { $ne: T[K] } | { $in: T[K][] } | { $like: string };
}

export type WhereCondition<T extends object> = Condition<T> & {
  "or"?: Array<Condition<T>>;
};

export type OrCondition<T extends object> = {
  type: 'or';
  conditions: Condition<T>;
};

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
  select(fields: Array<keyof T | Partial<Record<keyof T, string>>> | Partial<Record<keyof T, string>> | Query<any>, alias?: string): Select<T> {
    return new SelectBuilder<T>(this, fields, alias);
  }

  join<U extends object>(tableName: string, tableAlias?: string): Join<T, U> {
    const newQuery = new QueryBuilder<U>(tableName, tableAlias);
    return new JoinBuilder<T, U>(this, newQuery, 'INNER');
  }

  innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U> {
    return this.join<U>(tableName, tableAlias);
  }

  leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U> {
    const newQuery = new QueryBuilder<U>(tableName, tableAlias);
    return new JoinBuilder<T, U>(this, newQuery, 'LEFT');
  }

  where(conditions: WhereCondition<T>): Where<T> {
    // Merge conditions (simple approach - in real implementation might want more sophisticated merging)
    const mergedConditions = { ...this.conditions, ...conditions };
    return new WhereBuilder<T>(this.query, mergedConditions, this.orConditions);
  }

  or(conditions: Condition<T>): Where<T> {
    const orCondition: OrCondition<T> = {
      type: 'or',
      conditions
    };
    const newOrConditions = [...this.orConditions, orCondition];
    return new WhereBuilder<T>(this.query, this.conditions, newOrConditions);
  }

  limit(count: number, offset?: number): Limit<T> {
    return new LimitBuilder<T>(this, count, offset);
  }
}

// Need to import QueryBuilder here to avoid circular dependency
import { AliasGenerator } from "./aliasGenerator.js";
