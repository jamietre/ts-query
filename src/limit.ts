import { SelectBuilder } from "./select.js";
import type { Query } from "./types/query.js";
import type { Select } from "./types/select.js";
import type { Limit } from "./types/limit.js";

export class LimitBuilder<T extends object> implements Select<T> {
  query: Query<T>;
  limitValue: number;
  offsetValue?: number;

  constructor(query: Query<T>, limit: number, offset?: number) {
    this.query = query;
    this.limitValue = limit;
    this.offsetValue = offset;
  }

  offset(offsetValue: number): Limit<T> {
    return new LimitBuilder<T>(this.query, this.limitValue, offsetValue);
  }

  select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(
    fields: Array<keyof T | Partial<Record<keyof T, string>>> | Partial<Record<keyof T, string>>,
  ): Select<T> {
    return new SelectBuilder<T>(this, fields);
  }

  toString(): string {
    return this.select(['*' as any]).toString();
  }
}
