import { SelectBuilder } from "./selectBuilder.js";
import { LimitBuilder } from "./limitBuilder.js";
import { CaseBuilder } from "./caseBuilder.js";
import type { Query, FieldsBase, FieldsWithStar, OutputOptions } from "./types/query.js";
import type { Select, FieldAliasMapping } from "./types/select.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";
import type { Limit } from "./types/limit.js";
import type { Case } from "./types/case.js";

export class OrderByBuilder<T extends FieldsBase> implements OrderBy<T> {
  query: Query<T>;
  orderFields: Array<{ field: keyof T; direction: OrderDirection }> = [];

  constructor(options: { query: Query<T>; field: keyof T; direction: OrderDirection }) {
    this.query = options.query;
    this.orderFields = [{ field: options.field, direction: options.direction }];
  }

  orderBy(field: keyof T, direction: OrderDirection = "ASC"): OrderBy<T> {
    const newOrderFields = [...this.orderFields, { field, direction }];
    const newOrderBy = new OrderByBuilder<T>({
      query: this.query,
      field,
      direction,
    });
    newOrderBy.orderFields = newOrderFields;
    return newOrderBy;
  }

  select(fields: Array<FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string | true>>>): Select<T>;
  select(fields: Partial<Record<FieldsWithStar<T>, string | true>>): Select<T>;
  select<R extends FieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;
  select(fields: any): any {
    return new SelectBuilder(this, fields);
  }

  case(): Case<T> {
    return new CaseBuilder<T>(this.query);
  }

  selectAny<R extends FieldsBase>(fields: { [K in string]: keyof R }): Select<R>;
  selectAny<R extends FieldsBase>(fields: Array<string>): Select<R>;
  selectAny<R extends FieldsBase>(fields: any): Select<R> {
    return new SelectBuilder<R>(this.query as any, {}).selectAny(fields);
  }

  limit(count: number, offset?: number): Limit<T> {
    return new LimitBuilder<T>({ query: this.query, limit: count, offset });
  }

  toString(options?: OutputOptions): string {
    return this.select(["*"]).toString(options);
  }
}
