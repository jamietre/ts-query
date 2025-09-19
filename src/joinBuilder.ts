import { AliasGenerator } from "./aliasGenerator.js";
import { CompoundQueryBuilder } from "./compoundQueryBuilder.js";
import type { Query, FieldsBase } from "./types/query.js";

export type JoinType = "INNER" | "LEFT";

export class JoinBuilder<T extends FieldsBase, U extends FieldsBase> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  readonly joinType: JoinType;
  condition?: Partial<Record<keyof T, keyof U>>;
  public aliasGenerator: AliasGenerator = new AliasGenerator();
  constructor(options: { query1: Query<T>; query2: Query<U>; joinType: JoinType; aliasGenerator?: AliasGenerator }) {
    this.query1 = options.query1;
    this.query2 = options.query2;
    this.joinType = options.joinType;
    this.aliasGenerator = options.aliasGenerator || new AliasGenerator();
  }

  on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U> {
    this.condition = condition;
    return new CompoundQueryBuilder<T, U>({
      query1: this.query1,
      query2: this.query2,
      join: this,
      aliasGenerator: this.aliasGenerator,
    });
  }
}
