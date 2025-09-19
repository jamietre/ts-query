import { Select } from "./select.js";
import { Limit } from "./limit.js";
import { FieldsBase } from "./query.js";

export type OrderDirection = "ASC" | "DESC";

export interface OrderBy<T extends FieldsBase> extends Select<T> {
  orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
  limit(count: number, offset?: number): Limit<T>;
}
