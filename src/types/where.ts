import { Selectable } from "./query.js";

export interface Where<T extends object> extends Selectable<T> {
  or(conditions: any): Where<T>;
  limit(count: number, offset?: number): any;
}