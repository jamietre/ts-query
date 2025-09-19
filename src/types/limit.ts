import { Select } from "./select.js";

export interface Limit<T extends object> extends Select<T> {
  offset(offsetValue: number): Select<T>;
}
