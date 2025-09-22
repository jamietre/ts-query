import { Query, FieldsBase } from "./query.js";

export type JoinType = "INNER" | "LEFT";

type FieldMap<T> = {
  [k: string]: keyof T | true;
};

export interface Join<T extends FieldsBase, U extends FieldsBase> {
  // Original on() method for immediate join without field selection
  on(condition: Partial<Record<T, U>>): Query<T & U>;
}

export interface JoinWithFields<
  TMain extends FieldsBase,
  TJoined extends FieldsBase,
  TMapped extends FieldsBase = TJoined,
> {
  on(condition: Partial<Record<TMain, TJoined>>): Query<TMain & TMapped>;
}
