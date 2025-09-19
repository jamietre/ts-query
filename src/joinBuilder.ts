import { AliasGenerator } from "./aliasGenerator.js";
import { CompoundQueryBuilder } from "./compoundQueryBuilder.js";
import { JoinWithFieldsBuilder } from "./joinWithFieldsBuilder.js";
import type { Query, FieldsBase } from "./types/query.js";
import type { Join, JoinWithFields } from "./types/join.js";

type FieldMap<T> = {
  [k: string]: keyof T | true;
};

export type JoinType = "INNER" | "LEFT";

export class JoinBuilder<T extends FieldsBase, U extends FieldsBase> implements Join<T, U> {
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

  // New select method for choosing fields from the joined table
  alias(fields: Array<keyof U>): JoinWithFields<T, U>;
  alias(fields: FieldMap<U>): JoinWithFields<T, U>;
  alias(fields: Array<keyof U> | FieldMap<U>): JoinWithFields<T, U> {
    return new JoinWithFieldsBuilder<T, U>({
      query1: this.query1,
      query2: this.query2,
      joinBuilder: this,
      selectedFields: fields,
    });
  }

  // Original on() method for immediate join without field selection
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
