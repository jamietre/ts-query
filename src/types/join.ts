import { Query } from "./query.js";

export type JoinType = 'INNER' | 'LEFT';

export interface Join<T extends object, U extends object> {
  on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}