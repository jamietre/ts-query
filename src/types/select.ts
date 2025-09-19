import { Queryable } from "./query.js";

// Simpler mapped type that constrains alias values to be keys of target type
export type FieldAliasMapping<T extends object, R extends object> = {
  [K in keyof T]?: keyof R;
};

export interface Select<T extends object> extends Queryable<T> {
  select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;

  // Type-safe field aliasing with explicit target type
  select<R extends object>(fields: FieldAliasMapping<T, R>): Select<R>;
  select<R extends object>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;

  toString(): string;
}
