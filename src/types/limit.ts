import { Selectable } from "./query.js";

export interface Limit<T extends object> extends Selectable<T> {
  offset(offsetValue: number): Limit<T>;
}