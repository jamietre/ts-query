import { FieldsBase } from "./query.js";
import { Condition } from "./where.js";

export interface Case<TQuery extends FieldsBase> {
  when(condition: Condition<TQuery>): When<TQuery>;
  endAs(alias: string): Case<TQuery>;
  toString(): string;
  getExpression(): string;
}

export interface CaseElse<TQuery extends FieldsBase> extends Case<TQuery> {
  else(field: keyof TQuery): Case<TQuery>;
  else(value: string | number | boolean | null): Case<TQuery>;
  else(fieldRef: { field: string }): Case<TQuery>;
}

export interface When<TQuery extends FieldsBase> {
  then(field: keyof TQuery): CaseElse<TQuery>;
  then(value: string | number | boolean | null): CaseElse<TQuery>;
  then(fieldRef: { field: string }): CaseElse<TQuery>;
}
