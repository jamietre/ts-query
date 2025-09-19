import { Select } from "./select.js";
import { QueryFieldsBase } from "./query.js";

export interface Limit<T extends QueryFieldsBase> extends Select<T> {
  offset(offsetValue: number): Select<T>;
}
