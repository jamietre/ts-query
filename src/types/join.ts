import { Query, FieldsBase } from "./query.js";

export type JoinType = "INNER" | "LEFT";

type FieldMap<T> = {
  [k: string]: keyof T;
};

export interface Join<T extends FieldsBase, U extends FieldsBase> {
  // Allow selecting specific fields from the joined table U
  alias(fields: Array<keyof U>): JoinWithFields<T, U, U>;
  alias<V extends FieldMap<U>>(fields: V): JoinWithFields<T, U, V>;

  // Original on() method for immediate join without field selection
  on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}

export interface JoinWithFields<
  TMain extends FieldsBase,
  TJoined extends FieldsBase,
  TMapped extends FieldsBase = TJoined,
> {
  on(condition: Partial<Record<keyof TMain, keyof TJoined>>): Query<TMain & TMapped>;
}
