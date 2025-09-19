import { Queryable, FieldsBase } from "./query.js";

// Simpler mapped type that constrains alias values to be keys of target type
export type FieldAliasMapping<T extends FieldsBase, R extends FieldsBase> = {
  [K in keyof T]?: keyof R;
};

type FieldsWithStar<T extends FieldsBase> = keyof T | "*";
export interface Select<T extends FieldsBase> extends Queryable<T> {
  select(fields: Array<FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string>>>): Select<T>;
  select(fields: Partial<Record<FieldsWithStar<T>, string>>): Select<T>;

  // Type-safe field aliasing with explicit target type
  select<R extends FieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;

  toString(): string;
}
