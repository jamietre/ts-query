import { SelectBuilder } from "./selectBuilder.js";
import type { Query, FieldsBase, FieldsWithStar, OutputOptions } from "./types/query.js";
import type { Select, FieldAliasMapping } from "./types/select.js";
import type { Limit } from "./types/limit.js";

export class LimitBuilder<T extends FieldsBase> implements Select<T> {
  query: Query<T>;
  limitValue: number;
  offsetValue?: number;

  constructor(options: { query: Query<T>; limit: number; offset?: number }) {
    this.query = options.query;
    this.limitValue = options.limit;
    this.offsetValue = options.offset;
  }

  offset(offsetValue: number): Limit<T> {
    return new LimitBuilder<T>({
      query: this.query,
      limit: this.limitValue,
      offset: offsetValue,
    });
  }

  select(fields: Array<FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string | true>>>): Select<T>;
  select(fields: Partial<Record<FieldsWithStar<T>, string | true>>): Select<T>;
  select<R extends FieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;
  select(fields: any): any {
    return new SelectBuilder(this, fields);
  }

  toString(options?: OutputOptions): string {
    return this.select(["*"]).toString(options);
  }
}
