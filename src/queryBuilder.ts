import { JoinBuilder } from "./joinBuilder.js";
import { SelectBuilder } from "./selectBuilder.js";
import { WhereBuilder } from "./whereBuilder.js";
import { OrderByBuilder } from "./orderByBuilder.js";
import { LimitBuilder } from "./limitBuilder.js";
import type { Query, WhereCondition, Queryable, FieldsBase, FieldsWithStar, AliasedFields, OutputOptions } from "./types/query.js";
import type { Join } from "./types/join.js";
import type { Select, FieldAliasMapping } from "./types/select.js";
import type { Where } from "./types/where.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";
import type { Limit } from "./types/limit.js";

export class QueryBuilder<TQuery extends FieldsBase> implements Query<TQuery> {
  readonly tableName: string;
  readonly tableAlias?: string;
  constructor(options: { tableName: string; tableAlias?: string }) {
    this.tableName = options.tableName;
    this.tableAlias = options.tableAlias;
  }
  select(
    fields: Array<FieldsWithStar<TQuery> | Partial<Record<FieldsWithStar<TQuery>, string | true>>>,
  ): Select<TQuery>;
  select(fields: Partial<Record<FieldsWithStar<TQuery>, string | true>>): Select<TQuery>;
  select<R extends FieldsBase>(fields: FieldAliasMapping<TQuery, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof TQuery | FieldAliasMapping<TQuery, R>>): Select<R>;
  select(fields: any): any {
    return new SelectBuilder(this, fields);
  }

  join<TOther extends FieldsBase, TAlias extends string>(
    tableName: string | Queryable<TOther>,
    tableAlias: TAlias,
  ): Join<TQuery, AliasedFields<TAlias, TOther>> {
    if (typeof tableName === "string") {
      const newQuery = new QueryBuilder<AliasedFields<TAlias, TOther>>({
        tableName,
        tableAlias,
      });
      return new JoinBuilder<TQuery, AliasedFields<TAlias, TOther>>({
        query1: this,
        query2: newQuery,
        joinType: "INNER",
        outputOptions: { includeTerminator: true },
      });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<AliasedFields<TAlias, TOther>>({
        tableName: `(${tableName.toString({ includeTerminator: false })})`,
        tableAlias,
      });
      return new JoinBuilder<TQuery, AliasedFields<TAlias, TOther>>({
        query1: this,
        query2: newQuery,
        joinType: "INNER",
        outputOptions: { includeTerminator: true },
      });
    }
  }

  innerJoin<TOther extends FieldsBase, TAlias extends string>(
    tableName: string | Queryable<TOther>,
    tableAlias: TAlias,
  ): Join<TQuery, AliasedFields<TAlias, TOther>> {
    return this.join<TOther, TAlias>(tableName, tableAlias);
  }

  leftJoin<TOther extends FieldsBase, TAlias extends string>(
    tableName: string | Queryable<TOther>,
    tableAlias: TAlias,
  ): Join<TQuery, AliasedFields<TAlias, TOther>> {
    if (typeof tableName === "string") {
      const newQuery = new QueryBuilder<AliasedFields<TAlias, TOther>>({
        tableName,
        tableAlias,
      });
      return new JoinBuilder<TQuery, AliasedFields<TAlias, TOther>>({
        query1: this,
        query2: newQuery,
        joinType: "LEFT",
        outputOptions: { includeTerminator: true },
      });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<AliasedFields<TAlias, TOther>>({
        tableName: `(${tableName.toString({ includeTerminator: false })})`,
        tableAlias,
      });
      return new JoinBuilder<TQuery, AliasedFields<TAlias, TOther>>({
        query1: this,
        query2: newQuery,
        joinType: "LEFT",
        outputOptions: { includeTerminator: true },
      });
    }
  }

  where(conditions: WhereCondition<TQuery>): Where<TQuery> {
    return new WhereBuilder<TQuery>({ query: this, conditions, orConditions: [] });
  }

  orderBy(field: keyof TQuery, direction: OrderDirection = "ASC"): OrderBy<TQuery> {
    return new OrderByBuilder<TQuery>({ query: this, field, direction });
  }

  limit(count: number, offset?: number): Limit<TQuery> {
    return new LimitBuilder<TQuery>({ query: this, limit: count, offset });
  }

  toString(options?: OutputOptions): string {
    return this.select(["*"]).toString(options);
  }
}
