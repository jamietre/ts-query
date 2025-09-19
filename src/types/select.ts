import { Queryable, QueryFieldsBase } from "./query.js";

// Simpler mapped type that constrains alias values to be keys of target type
export type FieldAliasMapping<T extends QueryFieldsBase, R extends QueryFieldsBase> = {
  [K in keyof T]?: keyof R;
};

export interface Select<T extends QueryFieldsBase> extends Queryable<T> {
  select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;

  // Type-safe field aliasing with explicit target type
  select<R extends QueryFieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
  select<R extends QueryFieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;

  toString(): string;
}
