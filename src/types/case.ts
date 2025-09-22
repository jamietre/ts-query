import { FieldsBase, Select } from "../index.js";
import { Condition } from "./where.js";

export interface Case<TQuery extends FieldsBase> {
  when(condition: Condition<TQuery>): When<TQuery>;
  when(condition: Condition<TQuery>): When<TQuery>;
  end(): Select<TQuery>;
}

export interface CaseElse<TQuery extends FieldsBase> extends Case<TQuery> {
  else(field: keyof TQuery): Case<TQuery>;
  else(value: string | number | boolean | null): Case<TQuery>;
  end(): Select<TQuery>;
}

export interface When<TQuery extends FieldsBase> {
  then(field: keyof TQuery): CaseElse<TQuery>;
  then(value: string | number | boolean | null): CaseElse<TQuery>;
}
