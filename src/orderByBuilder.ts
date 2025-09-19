import { SelectBuilder } from "./selectBuilder.js";
import { LimitBuilder } from "./limitBuilder.js";
import type { Query, FieldsBase, FieldsWithStar } from "./types/query.js";
import type { Select, FieldAliasMapping } from "./types/select.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";
import type { Limit } from "./types/limit.js";
import { AliasGenerator } from "./aliasGenerator.js";

export class OrderByBuilder<T extends FieldsBase> implements OrderBy<T> {
  query: Query<T>;
  orderFields: Array<{ field: keyof T; direction: OrderDirection }> = [];
  aliasGenerator: AliasGenerator;

  constructor(options: { query: Query<T>; field: keyof T; direction: OrderDirection; aliasGenerator: AliasGenerator }) {
    this.query = options.query;
    this.orderFields = [{ field: options.field, direction: options.direction }];
    this.aliasGenerator = options.aliasGenerator;
  }

  orderBy(field: keyof T, direction: OrderDirection = "ASC"): OrderBy<T> {
    const newOrderFields = [...this.orderFields, { field, direction }];
    const newOrderBy = new OrderByBuilder<T>({
      query: this.query,
      field,
      direction,
      aliasGenerator: this.aliasGenerator,
    });
    newOrderBy.orderFields = newOrderFields;
    return newOrderBy;
  }

  select(fields: Array<FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string>>>): Select<T>;
  select(fields: Partial<Record<FieldsWithStar<T>, string>>): Select<T>;
  select<R extends FieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;
  select(fields: any): any {
    return new SelectBuilder(this, fields);
  }

  limit(count: number, offset?: number): Limit<T> {
    return new LimitBuilder<T>({ query: this.query, limit: count, offset, aliasGenerator: this.aliasGenerator });
  }

  toString(): string {
    return this.select(["*"]).toString();
  }
}
