import { JoinBuilder } from "./joinBuilder.js";
import { SelectBuilder } from "./selectBuilder.js";
import { WhereBuilder } from "./whereBuilder.js";
import { OrderByBuilder } from "./orderByBuilder.js";
import { LimitBuilder } from "./limitBuilder.js";
import { AliasGenerator } from "./aliasGenerator.js";
import type { Query, WhereCondition, Queryable, FieldsBase, FieldsWithStar } from "./types/query.js";
import type { Join } from "./types/join.js";
import type { Select, FieldAliasMapping } from "./types/select.js";
import type { Where } from "./types/where.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";
import type { Limit } from "./types/limit.js";

export class QueryBuilder<T extends FieldsBase> implements Query<T> {
  readonly tableName: string;
  readonly tableAlias: string;
  private aliasGenerator: AliasGenerator;
  constructor(options: { aliasGenerator: AliasGenerator; tableName: string; tableAlias?: string }) {
    this.aliasGenerator = options.aliasGenerator;
    this.tableName = options.tableName;
    this.tableAlias = options.tableAlias || this.aliasGenerator.generate();
  }
  select(fields: Array<FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string | true>>>): Select<T>;
  select(fields: Partial<Record<FieldsWithStar<T>, string | true>>): Select<T>;
  select<R extends FieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;
  select(fields: any): any {
    return new SelectBuilder(this, fields);
  }

  join<U extends FieldsBase>(tableName: string | Queryable<U>, tableAlias?: string): Join<T, U> {
    if (typeof tableName === "string") {
      const newQuery = new QueryBuilder<U>({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "INNER" });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<U>({
        tableName: `(${tableName.toString()})`,
        aliasGenerator: this.aliasGenerator,
      });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "INNER" });
    }
  }

  innerJoin<U extends FieldsBase>(entity: string | Queryable<U>, alias?: string): Join<T, U> {
    return this.join<U>(entity, alias);
  }

  leftJoin<U extends FieldsBase>(tableName: string | Queryable<U>, tableAlias?: string): Join<T, U> {
    if (typeof tableName === "string") {
      const newQuery = new QueryBuilder<U>({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "LEFT" });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<U>({
        tableName: `(${tableName.toString()})`,
        aliasGenerator: this.aliasGenerator,
      });
      return new JoinBuilder<T, U>({ query1: this, query2: newQuery, joinType: "LEFT" });
    }
  }

  where(conditions: WhereCondition<T>): Where<T> {
    return new WhereBuilder<T>({ query: this, conditions, orConditions: [], aliasGenerator: this.aliasGenerator });
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
