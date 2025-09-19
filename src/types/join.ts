import { Query, FieldsBase } from "./query.js";

export type JoinType = "INNER" | "LEFT";

export interface Join<T extends FieldsBase, U extends FieldsBase> {
  on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}
