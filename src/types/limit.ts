import { Select } from "./select.js";
import { FieldsBase } from "./query.js";

export interface Limit<T extends FieldsBase> extends Select<T> {
  offset(offsetValue: number): Select<T>;
}
