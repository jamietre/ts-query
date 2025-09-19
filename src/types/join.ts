import { Query, QueryFieldsBase } from "./query.js";

export type JoinType = 'INNER' | 'LEFT';

export interface Join<T extends QueryFieldsBase, U extends QueryFieldsBase> {
  on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}