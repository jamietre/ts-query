// Main entry point for ts-query package
import { QueryBuilder } from "./queryBuilder.js";
import type { AnyQueryable, Query, Queryable, AliasedFields, FieldsBase } from "./types/query.js";

// Create proper overloaded from function
// The overload for inferring from Queryable<T> must specify the actual types exposed, or inference of the generic
// type will not work correctly and T is always returned as "object"
// It seems OK to use Queryable<T> in the actual signature.

function from<T extends FieldsBase, TAlias extends string>(
  tableName: string,
  tableAlias: TAlias,
): Query<AliasedFields<TAlias, T>>;
function from<T extends FieldsBase>(tableName: string): Query<AliasedFields<undefined, T>>;
function from<T extends FieldsBase, TAlias extends string>(
  subquery: AnyQueryable<T>,
  tableAlias: TAlias,
): Query<AliasedFields<TAlias, T>>;
function from<T extends FieldsBase>(subquery: AnyQueryable<T>): Query<AliasedFields<undefined, T>>;
function from<T extends FieldsBase, TAlias extends string | undefined>(
  tableName: string | Queryable<T>,
  tableAlias?: TAlias,
): Query<AliasedFields<TAlias, T>> {
  if (typeof tableName === "string") {
    return new QueryBuilder<AliasedFields<TAlias, T>>({ tableName, tableAlias });
  } else {
    // Handle subquery case - create a QueryBuilder that wraps the subquery
    return new QueryBuilder<AliasedFields<TAlias, T>>({
      tableName: `(${tableName.toString()})`,
      tableAlias: tableAlias,
    });
  }
}

// Create the main query API
export const queryBuilder = {
  from,
};

// Only export interfaces as the main public API
export type { Query, WhereCondition, FieldsBase } from "./types/query.js";
export type { Join, JoinType } from "./types/join.js";
export type { Select } from "./types/select.js";
export type { Where, OrCondition, Condition } from "./types/where.js";
export type { Limit } from "./types/limit.js";
export type { OrderBy, OrderDirection } from "./types/orderBy.js";
