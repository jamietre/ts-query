import { Query, FieldsBase } from "./query.js";

export type JoinType = "INNER" | "LEFT";

export interface Join<T extends FieldsBase, U extends FieldsBase> {
  on(condition: Partial<Record<keyof T, keyof U>>): JoinedQuery<T & U>;
}

export interface JoinedQuery<T extends FieldsBase> extends Query<T> {
  mapFields(fields: Partial<Record<keyof T, string>>): Query<T>;
}
