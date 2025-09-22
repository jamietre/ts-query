import { Select } from "./select.js";
import { Join } from "./join.js";
import { Where, Condition } from "./where.js";
import { OrderBy, OrderDirection } from "./orderBy.js";
import { Limit } from "../index.js";

// Base type for query fields that includes "*" for selecting all

export type FieldsBase = {};

// Type that allows fields from T or "*" for selecting all fields
export type FieldsWithStar<T> = keyof T | "*";

export type AliasedFields<TAlias extends string | undefined, U extends FieldsBase> = TAlias extends undefined
  ? U
  : { [K in keyof U as `${TAlias}.${K & string}`]: U[K] };

// anything that can start a query
export interface Queryable<T = never> {
  toString(): string;
}

export type AnyQueryable<T extends FieldsBase> = Limit<T> | Where<T> | OrderBy<T> | Select<T> | Join<any, T> | Query<T>;

// A Query represents a table or subquery that can be queried further
// It extends Select to allow starting with SELECT * FROM ...
// It extends Queryable to allow using it as a subquery in joins and selects
export interface Query<TQuery extends FieldsBase> extends Select<TQuery>, Queryable<TQuery> {
  // Join with table name - requires explicit type parameter
  join<TOther extends FieldsBase, TAlias extends string>(
    tableName: string,
    tableAlias: TAlias,
  ): Join<TQuery, AliasedFields<TAlias, TOther>>;
  // Join with subquery - infers type from queryable
  join<TOther extends FieldsBase, TAlias extends string>(
    subquery: AnyQueryable<TOther>,
    tableAlias: TAlias,
  ): Join<TQuery, AliasedFields<TAlias, TOther>>;

  innerJoin<TOther extends FieldsBase, TAlias extends string>(
    subquery: AnyQueryable<TOther>,
    alias: TAlias,
  ): Join<TQuery, AliasedFields<TAlias, TOther>>;
  innerJoin<TOther extends FieldsBase, TAlias extends string>(
    tableName: string,
    tableAlias: TAlias,
  ): Join<TQuery, AliasedFields<TAlias, TOther>>;

  leftJoin<TOther extends FieldsBase, TAlias extends string>(
    subquery: AnyQueryable<TOther>,
    alias: TAlias,
  ): Join<TQuery, AliasedFields<TAlias, TOther>>;
  leftJoin<TOther extends FieldsBase, TAlias extends string>(
    tableName: string,
    tableAlias: TAlias,
  ): Join<TQuery, AliasedFields<TAlias, TOther>>;

  where(conditions: WhereCondition<TQuery>): Where<TQuery>;
  orderBy(field: keyof TQuery, direction?: OrderDirection): OrderBy<TQuery>;
  limit(count: number, offset?: number): Limit<TQuery>;
}

export type WhereCondition<T extends FieldsBase> = Condition<T> & {
  or?: Array<Condition<T>>;
};
