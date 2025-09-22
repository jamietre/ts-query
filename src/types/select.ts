import { Case } from "./case.js";
import { Queryable, FieldsBase, FieldsWithStar, OutputOptions } from "./query.js";

// Simpler mapped type that constrains alias values to be keys of target type
export type FieldAliasMapping<T extends FieldsBase, R extends FieldsBase> = {
  [K in keyof T]?: keyof R;
};

export interface Select<TQuery extends FieldsBase> extends Queryable<TQuery> {
  select(
    fields: Array<FieldsWithStar<TQuery> | Partial<Record<FieldsWithStar<TQuery>, string | true>>>,
  ): Select<TQuery>;
  select(fields: Partial<Record<FieldsWithStar<TQuery>, string | true>>): Select<TQuery>;

  // Type-safe field aliasing with explicit target type
  select<R extends FieldsBase>(fields: FieldAliasMapping<TQuery, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof TQuery | FieldAliasMapping<TQuery, R>>): Select<R>;
  /**
   * Arbitary select overload for things not yet supported (e.g. functions)
   */
  selectAny<R extends FieldsBase>(fields: { [K in string]: keyof R }): Select<R>;
  selectAny<R extends FieldsBase>(fields: Array<string>): Select<R>;

  case(): Case<TQuery>;
  toString(options?: OutputOptions): string;
}
