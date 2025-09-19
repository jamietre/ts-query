import { CompoundQueryBuilder } from "./compoundQueryBuilder.js";
import { JoinBuilder } from "./joinBuilder.js";
import { AliasGenerator } from "./aliasGenerator.js";
import type { Query, FieldsBase } from "./types/query.js";
import type { JoinWithFields } from "./types/join.js";

type FieldMap<T> = {
  [k: string]: keyof T | true;
};

export class JoinWithFieldsBuilder<T extends FieldsBase, U extends FieldsBase> implements JoinWithFields<T, U> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  readonly joinBuilder: JoinBuilder<T, U>;
  readonly selectedFields: Array<keyof U> | FieldMap<U>;

  constructor(options: {
    query1: Query<T>;
    query2: Query<U>;
    joinBuilder: JoinBuilder<T, U>;
    selectedFields: Array<keyof U> | FieldMap<U>;
  }) {
    this.query1 = options.query1;
    this.query2 = options.query2;
    this.joinBuilder = options.joinBuilder;
    this.selectedFields = options.selectedFields;
  }

  on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U> {
    // Set the condition on the original join builder
    this.joinBuilder.condition = condition;

    // Determine if we have field mappings
    const joinFieldMapping = !Array.isArray(this.selectedFields) ? this.selectedFields : undefined;

    // Create the compound query builder with the selected fields information
    return new CompoundQueryBuilder<T, U>({
      query1: this.query1,
      query2: this.query2,
      join: this.joinBuilder,
      aliasGenerator: this.joinBuilder.aliasGenerator,
      joinFieldMapping,
    });
  }
}