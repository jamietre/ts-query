import { CompoundQueryBuilder } from "./compoundQueryBuilder.js";
import type { Query, FieldsBase } from "./types/query.js";
import type { Join, JoinWithFields } from "./types/join.js";

type FieldMap<T> = {
  [k: string]: keyof T | true;
};

export type JoinType = "INNER" | "LEFT";

export class JoinBuilder<TLeft extends FieldsBase, TRight extends FieldsBase> implements Join<TLeft, TRight> {
  readonly query1: Query<TLeft>;
  readonly query2: Query<TRight>;
  readonly joinType: JoinType;
  condition?: Partial<Record<keyof TLeft, keyof TRight>>;

  constructor(options: { query1: Query<TLeft>; query2: Query<TRight>; joinType: JoinType }) {
    this.query1 = options.query1;
    this.query2 = options.query2;
    this.joinType = options.joinType;
  }
  // Original on() method for immediate join without field selection
  on(condition: Partial<Record<keyof TLeft, keyof TRight>>): Query<TLeft & TRight> {
    this.condition = condition;
    return new CompoundQueryBuilder<TLeft, TRight>({
      query1: this.query1,
      query2: this.query2,
      join: this,
    });
  }
}
