import { QueryBuilder } from "./queryBuilder.js";
import { SelectBuilder } from "./selectBuilder.js";
import { JoinBuilder } from "./joinBuilder.js";
import { LimitBuilder } from "./limitBuilder.js";
import { OrderByBuilder } from "./orderByBuilder.js";
import type { Query, WhereCondition, Queryable, FieldsBase, FieldsWithStar, OutputOptions } from "./types/query.js";
import type { Select, FieldAliasMapping } from "./types/select.js";
import type { Join } from "./types/join.js";
import type { Limit } from "./types/limit.js";
import type { Where, Condition, OrCondition } from "./types/where.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";

export class WhereBuilder<T extends FieldsBase> implements Where<T> {
  readonly query: Query<T>;
  readonly conditions: WhereCondition<T>;
  readonly orConditions: OrCondition<T>[] = [];

  constructor(options: { query: Query<T>; conditions: WhereCondition<T>; orConditions: OrCondition<T>[] }) {
    this.query = options.query;
    this.conditions = options.conditions;
    this.orConditions = options.orConditions;
  }

  select(fields: Array<FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string | true>>>): Select<T>;
  select(fields: Partial<Record<FieldsWithStar<T>, string | true>>): Select<T>;
  select<R extends FieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;
  select(fields: any): any {
    return new SelectBuilder(this, fields);
  }

  join<U extends FieldsBase, TAlias extends string>(tableName: string | Queryable<U>, tableAlias: TAlias): Join<T, U> {
    if (typeof tableName === "string") {
      const newQuery = new QueryBuilder<U>({ tableName, tableAlias });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "INNER", outputOptions: { includeTerminator: true } });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<U>({
        tableName: `(${tableName.toString({ includeTerminator: false })})`,
        tableAlias,
      });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "INNER", outputOptions: { includeTerminator: true } });
    }
  }

  innerJoin<U extends FieldsBase, TAlias extends string>(entity: string | Queryable<U>, alias: TAlias): Join<T, U> {
    return this.join<U, TAlias>(entity, alias);
  }

  leftJoin<U extends FieldsBase, TAlias extends string>(entity: string | Queryable<U>, alias: TAlias): Join<T, U> {
    if (typeof entity === "string") {
      const newQuery = new QueryBuilder<U>({
        tableName: entity,
        tableAlias: alias,
      });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "LEFT", outputOptions: { includeTerminator: true } });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<U>({
        tableName: `(${entity.toString({ includeTerminator: false })})`,
        tableAlias: alias,
      });
      return new JoinBuilder<T, U>({
        query1: this,
        query2: newQuery,
        joinType: "LEFT",
        outputOptions: { includeTerminator: true },
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
    });
  }

  orderBy(field: keyof T, direction: OrderDirection = "ASC"): OrderBy<T> {
    return new OrderByBuilder<T>({ query: this, field, direction });
  }

  limit(count: number, offset?: number): Limit<T> {
    return new LimitBuilder<T>({ query: this, limit: count, offset });
  }

  toString(options?: OutputOptions): string {
    return this.select(["*"]).toString(options);
  }
}
