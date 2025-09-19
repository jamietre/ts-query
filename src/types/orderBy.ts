import { Select } from "./select.js";
import { Limit } from "./limit.js";

export type OrderDirection = 'ASC' | 'DESC';

export interface OrderBy<T extends object> extends Select<T> {
  orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
  limit(count: number, offset?: number): Limit<T>;
}