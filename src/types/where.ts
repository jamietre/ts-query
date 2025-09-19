import { Select } from "./select.js";
import { OrderBy, OrderDirection } from "./orderBy.js";

export interface Where<T extends object> extends Select<T> {
  or(conditions: any): Where<T>;
  orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
  limit(count: number, offset?: number): any;
}
