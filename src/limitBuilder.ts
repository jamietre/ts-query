import { SelectBuilder } from "./selectBuilder.js";
import type { Query, FieldsBase } from "./types/query.js";
import type { Select } from "./types/select.js";
import type { Limit } from "./types/limit.js";
import { AliasGenerator } from "./aliasGenerator.js";

export class LimitBuilder<T extends FieldsBase> implements Select<T> {
  query: Query<T>;
  limitValue: number;
  offsetValue?: number;
  aliasGenerator: AliasGenerator;

  constructor(options: { query: Query<T>; limit: number; offset?: number; aliasGenerator: AliasGenerator }) {
    this.query = options.query;
    this.limitValue = options.limit;
    this.offsetValue = options.offset;
    this.aliasGenerator = options.aliasGenerator;
  }

  offset(offsetValue: number): Limit<T> {
    return new LimitBuilder<T>({
      query: this.query,
      limit: this.limitValue,
      offset: offsetValue,
      aliasGenerator: this.aliasGenerator,
    });
  }

  select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(fields: Array<keyof T | Partial<Record<keyof T, string>>> | Partial<Record<keyof T, string>>): Select<T> {
    return new SelectBuilder<T>(this, fields);
  }

  toString(): string {
    return this.select(["*"]).toString();
  }
}
