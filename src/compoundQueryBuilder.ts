import { QueryBuilder } from "./queryBuilder.js";
import { JoinBuilder } from "./joinBuilder.js";
import { SelectBuilder } from "./selectBuilder.js";
import { WhereBuilder } from "./whereBuilder.js";
import { OrderByBuilder } from "./orderByBuilder.js";
import { LimitBuilder } from "./limitBuilder.js";
import { CaseBuilder } from "./caseBuilder.js";
import type { Query, WhereCondition, Queryable, FieldsBase, FieldsWithStar, OutputOptions } from "./types/query.js";
import type { Join } from "./types/join.js";
import type { Select, FieldAliasMapping } from "./types/select.js";
import type { Where } from "./types/where.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";
import type { Limit } from "./types/limit.js";
import type { Case } from "./types/case.js";

type FieldMap<T> = {
  [k: string]: keyof T | true;
};

export class CompoundQueryBuilder<T extends FieldsBase, U extends FieldsBase> implements Query<T & U> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  readonly joinInfo: JoinBuilder<T, U>;
  readonly joinFieldMapping?: FieldMap<U>; // Store field mappings from join.select()
  readonly outputOptions: OutputOptions;
  constructor(options: {
    query1: Query<T>;
    query2: Query<U>;
    join: JoinBuilder<T, U>;
    joinFieldMapping?: FieldMap<U>;
    outputOptions: OutputOptions;
  }) {
    this.query1 = options.query1;
    this.query2 = options.query2;
    this.joinInfo = options.join;
    this.joinFieldMapping = options.joinFieldMapping;
    this.outputOptions = options.outputOptions;
  }
  select(fields: Array<FieldsWithStar<T & U> | Partial<Record<FieldsWithStar<T & U>, string | true>>>): Select<T & U>;
  select(fields: Partial<Record<FieldsWithStar<T & U>, string | true>>): Select<T & U>;
  select<R extends FieldsBase>(fields: FieldAliasMapping<T & U, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T & U, R>>): Select<R>;
  select(fields: any): any {
    return new SelectBuilder<T & U>(this as Query<T & U>, fields);
  }

  case(): Case<T & U> {
    return new CaseBuilder<T & U>(this as Query<T & U>);
  }

  selectAny<R extends FieldsBase>(fields: { [K in string]: keyof R }): Select<R>;
  selectAny<R extends FieldsBase>(fields: Array<string>): Select<R>;
  selectAny<R extends FieldsBase>(fields: any): Select<R> {
    return new SelectBuilder<R>(this as any, {}).selectAny(fields);
  }
  join<V extends FieldsBase, TAlias extends string>(target: string | Queryable<V>, tableAlias: TAlias): Join<T & U, V> {
    if (typeof target === "string") {
      const newQuery = new QueryBuilder<V>({ tableName: target, tableAlias });
      return new JoinBuilder<T & U, V>({
        query1: this,
        query2: newQuery,
        joinType: "INNER",
        outputOptions: this.outputOptions,
      });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<V>({
        tableName: `(${target.toString({ ...this.outputOptions, includeTerminator: false })})`,
        tableAlias: tableAlias,
      });
      return new JoinBuilder<T & U, V>({
        query1: this,
        query2: newQuery,
        joinType: "INNER",
        outputOptions: this.outputOptions,
      });
    }
  }

  innerJoin<V extends FieldsBase, TAlias extends string>(
    tableName: string | Queryable<V>,
    tableAlias: TAlias,
  ): Join<T & U, V> {
    return this.join<V, TAlias>(tableName, tableAlias);
  }

  leftJoin<V extends FieldsBase>(tableName: string | Queryable<V>, tableAlias: string): Join<T & U, V> {
    if (typeof tableName === "string") {
      const newQuery = new QueryBuilder<V>({ tableName, tableAlias });
      return new JoinBuilder<T & U, V>({
        query1: this,
        query2: newQuery,
        joinType: "LEFT",
        outputOptions: this.outputOptions,
      });
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<V>({
        tableName: `(${tableName.toString({ ...this.outputOptions, includeTerminator: false })})`,
        tableAlias: tableAlias,
      });
      return new JoinBuilder<T & U, V>({
        query1: this,
        query2: newQuery,
        joinType: "LEFT",
        outputOptions: this.outputOptions,
      });
    }
  }

  where(conditions: WhereCondition<T & U>): Where<T & U> {
    return new WhereBuilder<T & U>({ query: this, conditions, orConditions: [] });
  }

  orderBy(field: keyof (T & U), direction: OrderDirection = "ASC"): OrderBy<T & U> {
    return new OrderByBuilder<T & U>({ query: this, field, direction });
  }

  limit(count: number, offset?: number): Limit<T & U> {
    return new LimitBuilder<T & U>({ query: this, limit: count, offset });
  }

  toString(options?: OutputOptions): string {
    return this.select(["*" as any]).toString(options);
  }
}
