import { CompoundQueryBuilder } from "./compoundQuery.js";
import type { Query } from "./types/query.js";

export type JoinType = 'INNER' | 'LEFT';

export class JoinBuilder<T extends object, U extends object> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  readonly joinType: JoinType;
  condition?: Partial<Record<keyof T, keyof U>>;

  constructor(query1: Query<T>, query2: Query<U>, joinType: JoinType = 'LEFT') {
    this.query1 = query1;
    this.query2 = query2;
    this.joinType = joinType;
  }

  on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U> {
    this.condition = condition;
    return new CompoundQueryBuilder<T, U>(this.query1, this.query2, this);
  }
}
