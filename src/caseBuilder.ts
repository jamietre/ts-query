import type { FieldsBase, OutputOptions } from "./types/query.js";
import type { Case, CaseElse, When } from "./types/case.js";
import type { Condition } from "./types/where.js";
import type { Select } from "./types/select.js";
import { SelectBuilder } from "./selectBuilder.js";

interface FieldReference {
  field: string;
}

interface CaseClause<T extends FieldsBase> {
  condition: Condition<T>;
  thenValue: keyof T | string | number | boolean | null | FieldReference;
}

// Helper function to create field references
export function field(name: string): FieldReference {
  return { field: name };
}

export class CaseBuilder<T extends FieldsBase> implements Case<T>, CaseElse<T> {
  private clauses: CaseClause<T>[] = [];
  private elseValue?: keyof T | string | number | boolean | null | FieldReference;
  private aliasName?: string;
  private sourceQuery?: any; // Store reference to source query for complete SELECT generation

  constructor(sourceQuery?: any) {
    this.sourceQuery = sourceQuery;
  }

  when(condition: Condition<T>): When<T> {
    return new WhenBuilder<T>(this, condition);
  }

  else(value: keyof T | string | number | boolean | null | FieldReference): Case<T> {
    this.elseValue = value;
    return this;
  }

  endAs(alias: string): Case<T> {
    this.aliasName = alias;
    return this;
  }

  addClause(condition: Condition<T>, thenValue: keyof T | string | number | boolean | null | FieldReference): void {
    this.clauses.push({ condition, thenValue });
  }

  // Add select method to make this behave like a complete query builder
  select(fields: any): Select<T> {
    if (!this.sourceQuery) {
      throw new Error("Cannot create SELECT query without source query");
    }
    const caseExpression = this.getCaseExpression();
    return this.sourceQuery.select([...fields, { [caseExpression]: true }]);
  }

  toString(options?: OutputOptions): string {
    // Generate a complete SELECT statement like other query builders
    if (this.sourceQuery) {
      const caseExpression = this.getCaseExpression();
      return this.sourceQuery.select([{ [caseExpression]: true }]).toString(options);
    }

    // Fallback to just the CASE expression if no source query
    return this.getCaseExpression();
  }

  // Method to get just the CASE expression when needed for field selection
  getExpression(): string {
    return this.getCaseExpression();
  }

  // Method to get just the CASE expression (for internal use)
  private getCaseExpression(): string {
    if (this.clauses.length === 0) {
      throw new Error("CASE statement must have at least one WHEN clause");
    }

    const whenClauses = this.clauses
      .map((clause) => {
        const conditionStr = this.formatCondition(clause.condition);
        const thenStr = this.formatValue(clause.thenValue);
        return `WHEN ${conditionStr} THEN ${thenStr}`;
      })
      .join(" ");

    let caseStr = `CASE ${whenClauses}`;

    if (this.elseValue !== undefined) {
      caseStr += ` ELSE ${this.formatValue(this.elseValue)}`;
    }

    caseStr += " END";

    if (this.aliasName) {
      caseStr += ` AS ${this.aliasName}`;
    }

    return caseStr;
  }

  private formatCondition(condition: Condition<T>): string {
    // Handle the condition object similar to how WhereBuilder formats conditions
    const entries = Object.entries(condition);
    if (entries.length === 0) {
      throw new Error("Condition cannot be empty");
    }

    return entries
      .map(([field, value]: [string, any]) => {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          // Handle operators like $gt, $lt, etc.
          const operatorEntries = Object.entries(value);
          if (operatorEntries.length > 0) {
            const [operator, operatorValue] = operatorEntries[0] as [string, any];
            switch (operator) {
              case "$eq":
                return value == undefined ? `${field} IS NULL` : `${field} = ${this.formatValue(operatorValue)}`;
              case "$gt":
                return `${field} > ${this.formatValue(operatorValue)}`;
              case "$lt":
                return `${field} < ${this.formatValue(operatorValue)}`;
              case "$gte":
                return `${field} >= ${this.formatValue(operatorValue)}`;
              case "$lte":
                return `${field} <= ${this.formatValue(operatorValue)}`;
              case "$ne":
                return operatorValue == undefined
                  ? `${field} IS NOT NULL`
                  : `${field} != ${this.formatValue(operatorValue)}`;
              case "$in":
                const inValues = Array.isArray(operatorValue)
                  ? operatorValue.map((v: any) => this.formatValue(v)).join(", ")
                  : this.formatValue(operatorValue);
                return `${field} IN (${inValues})`;
              case "$like":
                return `${field} LIKE ${this.formatValue(operatorValue)}`;
              default:
                return `${field} = ${this.formatValue(operatorValue)}`;
            }
          }
        }

        // Handle null/undefined values
        if (value == undefined) {
          return `${field} IS NULL`;
        }

        return `${field} = ${this.formatValue(value)}`;
      })
      .join(" AND ");
  }

  private formatValue(value: keyof T | string | number | boolean | null | FieldReference): string {
    if (value === null || value === undefined) {
      return "NULL";
    }
    if (typeof value === "object" && value !== null && "field" in value) {
      // Field reference object
      return String(value.field);
    }
    if (typeof value === "string") {
      return `'${value}'`; // String literal, with quotes
    }
    return String(value);
  }
}

class WhenBuilder<T extends FieldsBase> implements When<T> {
  constructor(
    private caseBuilder: CaseBuilder<T>,
    private condition: Condition<T>,
  ) {}

  then(value: keyof T | string | number | boolean | null | FieldReference): CaseElse<T> {
    this.caseBuilder.addClause(this.condition, value);
    return this.caseBuilder;
  }
}
