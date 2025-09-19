import { CompoundQuery } from "./compoundQuery";
import { Query } from "./query";

export type JoinType = 'INNER' | 'LEFT';

export class Join<T extends object, U extends object> {
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
    return new CompoundQuery<T, U>(this.query1, this.query2, this);
  }
}
