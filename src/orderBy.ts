import { SelectBuilder } from "./select.js";
import { LimitBuilder } from "./limit.js";
import type { Query } from "./types/query.js";
import type { Select } from "./types/select.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";
import type { Limit } from "./types/limit.js";

export class OrderByBuilder<T extends object> implements OrderBy<T> {
  query: Query<T>;
  orderFields: Array<{ field: keyof T; direction: OrderDirection }> = [];

  constructor(query: Query<T>, field: keyof T, direction: OrderDirection = 'ASC') {
    this.query = query;
    this.orderFields = [{ field, direction }];
  }

  orderBy(field: keyof T, direction: OrderDirection = 'ASC'): OrderBy<T> {
    const newOrderFields = [...this.orderFields, { field, direction }];
    const newOrderBy = new OrderByBuilder<T>(this.query, field, direction);
    newOrderBy.orderFields = newOrderFields;
    return newOrderBy;
  }

  select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(subquery: Query<any>, alias?: string): Select<T>;
  select(
    fields: Array<keyof T | Partial<Record<keyof T, string>>> | Partial<Record<keyof T, string>> | Query<any>,
    alias?: string,
  ): Select<T> {
    return new SelectBuilder<T>(this, fields, alias);
  }

  limit(count: number, offset?: number): Limit<T> {
    return new LimitBuilder<T>(this.query, count, offset);
  }
}