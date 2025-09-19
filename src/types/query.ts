import { Select } from "./select.js";
import { Join } from "./join.js";
import { Where } from "./where.js";

export interface Selectable<T extends object> {
  select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(subquery: Query<any>, alias?: string): Select<T>;
  select(fields: Array<keyof T | Partial<Record<keyof T, string>>> | Partial<Record<keyof T, string>> | Query<any>, alias?: string): Select<T>;
}

export interface Query<T extends object> extends Selectable<T> {
  join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
  where(conditions: WhereCondition<T>): Where<T>;
}

export type WhereCondition<T extends object> = {
  [K in keyof T]?: T[K] | { $eq: T[K] } | { $gt: T[K] } | { $lt: T[K] } | { $gte: T[K] } | { $lte: T[K] } | { $ne: T[K] } | { $in: T[K][] } | { $like: string };
} & {
  "or"?: Array<Condition<T>>;
};

type Condition<T extends object> = {
  [K in keyof T]?: T[K] | { $eq: T[K] } | { $gt: T[K] } | { $lt: T[K] } | { $gte: T[K] } | { $lte: T[K] } | { $ne: T[K] } | { $in: T[K][] } | { $like: string };
}

export type OrCondition<T extends object> = {
  type: 'or';
  conditions: Condition<T>;
};