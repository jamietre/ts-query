import { CompoundQueryBuilder } from "./compoundQueryBuilder.js";
import { QueryBuilder } from "./queryBuilder.js";
import { WhereBuilder } from "./whereBuilder.js";
import { LimitBuilder } from "./limitBuilder.js";
import { OrderByBuilder } from "./orderByBuilder.js";
import type { Queryable, FieldsBase, FieldsWithStar } from "./types/query.js";
import type { Select, FieldAliasMapping } from "./types/select.js";

export class SelectBuilder<T extends FieldsBase> implements Select<T> {
  query: Queryable<T>;
  fields: Partial<Record<FieldsWithStar<T>, string | true>> = {};

  constructor(query: Queryable<T>, fields: any) {
    this.query = query;

    if (Array.isArray(fields)) {
      fields.forEach((field: FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string | true>>) => {
        if (typeof field === "string" || typeof field === "symbol" || typeof field === "number") {
          // Handle string field names (including "*")
          this.fields[field as FieldsWithStar<T>] = field as string;
        } else if (typeof field === "object" && field !== null) {
          // Handle object with field mappings
          Object.entries(field).forEach(([key, value]) => {
            this.fields[key as FieldsWithStar<T>] = value as string | true;
          });
        }
      });
      return;
    }

    if (fields && typeof fields === "object") {
      Object.entries(fields).forEach(([key, value]) => {
        this.fields[key as FieldsWithStar<T>] = value as string | true;
      });
    }
  }
  select(fields: Array<FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string | true>>>): Select<T>;
  select(fields: Partial<Record<FieldsWithStar<T>, string | true>>): Select<T>;
  select<R extends FieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
  select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;
  select(fields: any): any {
    return new SelectBuilder(this.query, fields);
  }

  private getJoinSource(query: Queryable<any>): string {
    if (query instanceof QueryBuilder) {
      // For JOIN clauses, don't use AS keyword
      const isSubquery = query.tableName.startsWith("(");
      return isSubquery ? `${query.tableName} ${query.tableAlias}` : `${query.tableName} ${query.tableAlias}`;
    } else if (query instanceof CompoundQueryBuilder) {
      const left = this.getSource(query.query1);
      const right = this.getJoinSource(query.query2);
      const on = Object.entries(query.joinInfo.condition || {})
        .map(([key, value]) => {
          const leftSide = String(key).includes(".")
            ? String(key)
            : `${this.getRightmostTableAlias(query.query1)}.${String(key)}`;
          const rightSide = String(value).includes(".")
            ? String(value)
            : `${this.getRightmostTableAlias(query.query2)}.${String(value)}`;
          return `${leftSide} = ${rightSide}`;
        })
        .join(" AND ");
      const joinType = query.joinInfo.joinType;
      return `${left} ${joinType} JOIN ${right} ON ${on}`;
    } else if (query instanceof WhereBuilder) {
      return this.getJoinSource(query.query);
    } else if (query instanceof LimitBuilder) {
      return this.getJoinSource(query.query);
    } else if (query instanceof OrderByBuilder) {
      return this.getJoinSource(query.query);
    }
    return "";
  }

  private getSource(query: Queryable<any>): string {
    if (query instanceof QueryBuilder) {
      // Only emit alias if the overall query context has joins OR if this is a subquery OR if an alias was explicitly provided
      const hasJoins = this.queryHasJoins(this.query);
      const isSubquery = query.tableName.startsWith("(");
      const hasExplicitAlias = query.tableAlias !== undefined;
      return hasJoins || isSubquery || hasExplicitAlias ?
        (isSubquery ? `${query.tableName} AS ${query.tableAlias}` : `${query.tableName} ${query.tableAlias}`) :
        query.tableName;
    } else if (query instanceof CompoundQueryBuilder) {
      const left = this.getSource(query.query1);
      const on = Object.entries(query.joinInfo.condition || {})
        .map(([key, value]) => {
          // If key/value already contains dot notation, use as-is, otherwise add table alias
          const leftSide = String(key).includes(".")
            ? String(key)
            : `${this.getRightmostTableAlias(query.query1)}.${String(key)}`;
          const rightSide = String(value).includes(".")
            ? String(value)
            : `${this.getRightmostTableAlias(query.query2)}.${String(value)}`;
          return `${leftSide} = ${rightSide}`;
        })
        .join(" AND ");
      const joinType = query.joinInfo.joinType;
      // For JOIN clauses, we need to format the right side without AS
      const rightFormatted = this.getJoinSource(query.query2);
      return `${left} ${joinType} JOIN ${rightFormatted} ON ${on}`;
    } else if (query instanceof WhereBuilder) {
      return this.getSource(query.query);
    } else if (query instanceof LimitBuilder) {
      return this.getSource(query.query);
    } else if (query instanceof OrderByBuilder) {
      return this.getSource(query.query);
    }
    return "";
  }

  private getRightmostTableAlias(query: Queryable<any>): string | undefined {
    if (query instanceof QueryBuilder) {
      return query.tableAlias;
    } else if (query instanceof CompoundQueryBuilder) {
      // For compound queries, get the rightmost table alias (the most recently joined table)
      return this.getRightmostTableAlias(query.query2);
    } else if (query instanceof WhereBuilder) {
      return this.getRightmostTableAlias(query.query);
    } else if (query instanceof LimitBuilder) {
      return this.getRightmostTableAlias(query.query);
    } else if (query instanceof OrderByBuilder) {
      return this.getRightmostTableAlias(query.query);
    }
    return "";
  }

  private formatCondition(key: string, value: any, tableAlias: string | undefined): string {
    // Use key as-is if it already contains dot notation, otherwise add table alias if available
    const fieldName = key.includes(".") ? key : (tableAlias ? `${tableAlias}.${key}` : key);

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Handle operators like $gt, $lt, etc.
      const entries = Object.entries(value);
      if (entries.length > 0) {
        const [operator, operatorValue] = entries[0];
        switch (operator) {
          case "$eq":
            // Handle $eq with null as IS NULL
            if (operatorValue == undefined) {
              return `${fieldName} IS NULL`;
            }
            return `${fieldName} = ${this.formatValue(operatorValue)}`;
          case "$gt":
            return `${fieldName} > ${this.formatValue(operatorValue)}`;
          case "$lt":
            return `${fieldName} < ${this.formatValue(operatorValue)}`;
          case "$gte":
            return `${fieldName} >= ${this.formatValue(operatorValue)}`;
          case "$lte":
            return `${fieldName} <= ${this.formatValue(operatorValue)}`;
          case "$ne":
            // Handle $ne with null as IS NOT NULL
            if (operatorValue == undefined) {
              return `${fieldName} IS NOT NULL`;
            }
            return `${fieldName} != ${this.formatValue(operatorValue)}`;
          case "$in":
            return `${fieldName} IN (${Array.isArray(operatorValue) ? operatorValue.map((v) => this.formatValue(v)).join(", ") : this.formatValue(operatorValue)})`;
          case "$like":
            return `${fieldName} LIKE ${this.formatValue(operatorValue)}`;
          default:
            return `${fieldName} = ${this.formatValue(operatorValue)}`;
        }
      }
    }

    // Handle null/undefined values - use IS NULL instead of = null
    if (value == undefined) {
      return `${fieldName} IS NULL`;
    }

    return `${fieldName} = ${this.formatValue(value)}`;
  }

  private getWhereClause(query: Queryable<T>): string {
    if (query instanceof WhereBuilder) {
      // Extract the inline "or" conditions from the main conditions
      const { or: inlineOrConditions, ...mainConditions } = query.conditions;

      // Process main conditions (excluding "or")
      const conditions = Object.entries(mainConditions)
        .map(([key, value]) => {
          const tableAlias = this.getTableAliasForField(query, key);
          return this.formatCondition(key, value, tableAlias);
        })
        .join(" AND ");

      // Handle inline OR conditions
      const inlineOrClauses = (inlineOrConditions || []).map((orCondition) => {
        const orClauses = Object.entries(orCondition)
          .map(([key, value]) => {
            const tableAlias = this.getTableAliasForField(query, key);
            return this.formatCondition(key, value, tableAlias);
          })
          .join(" AND ");
        return `(${orClauses})`;
      });

      // Handle chained OR conditions
      const chainedOrConditions = query.orConditions.map((orCondition) => {
        const orClauses = Object.entries(orCondition.conditions)
          .map(([key, value]) => {
            const tableAlias = this.getTableAliasForField(query, key);
            return this.formatCondition(key, value, tableAlias);
          })
          .join(" AND ");
        return `(${orClauses})`;
      });

      // Combine all OR conditions
      const allOrConditions = [...inlineOrClauses, ...chainedOrConditions];

      let allConditions = conditions;
      if (allOrConditions.length > 0) {
        allConditions = allConditions
          ? `(${allConditions}) OR ${allOrConditions.join(" OR ")}`
          : allOrConditions.join(" OR ");
      }

      const nestedWhere = this.getWhereClause(query.query);
      return nestedWhere ? `${allConditions} AND ${nestedWhere}` : allConditions;
    } else if (query instanceof LimitBuilder) {
      return this.getWhereClause(query.query);
    } else if (query instanceof OrderByBuilder) {
      return this.getWhereClause(query.query);
    }
    return "";
  }

  private getTableAliasForField(query: Queryable<any>, fieldAlias: string): string | undefined {
    if (query instanceof CompoundQueryBuilder && query.joinFieldMapping) {
      // Check if this alias exists in the join field mapping (from joined table)
      if (fieldAlias in query.joinFieldMapping) {
        // This alias maps to a field in the joined table
        return this.getRightmostTableAlias(query);
      }

      // If alias not found in join mapping, assume it's from the leftmost (base) table
      return this.getLeftmostTableAlias(query);
    }

    // Default: use the leftmost (base) table alias
    return this.getLeftmostTableAlias(query);
  }

  private getLeftmostTableAlias(query: Queryable<any>): string | undefined {
    if (query instanceof QueryBuilder) {
      return query.tableAlias;
    } else if (query instanceof CompoundQueryBuilder) {
      // For compound queries, get the leftmost table alias (the base table)
      return this.getLeftmostTableAlias(query.query1);
    } else if (query instanceof WhereBuilder) {
      return this.getLeftmostTableAlias(query.query);
    } else if (query instanceof LimitBuilder) {
      return this.getLeftmostTableAlias(query.query);
    } else if (query instanceof OrderByBuilder) {
      return this.getLeftmostTableAlias(query.query);
    }
    return "";
  }

  private queryHasJoins(query: Queryable<any>): boolean {
    if (query instanceof QueryBuilder) {
      return false; // Single table, no joins
    } else if (query instanceof CompoundQueryBuilder) {
      return true; // CompoundQueryBuilder indicates a join
    } else if (query instanceof WhereBuilder) {
      return this.queryHasJoins(query.query);
    } else if (query instanceof LimitBuilder) {
      return this.queryHasJoins(query.query);
    } else if (query instanceof OrderByBuilder) {
      return this.queryHasJoins(query.query);
    }
    return false;
  }

  private getLimitClause(query: Queryable<any>): string {
    if (query instanceof LimitBuilder) {
      let limitClause = `LIMIT ${query.limitValue}`;
      if (query.offsetValue !== undefined) {
        limitClause += ` OFFSET ${query.offsetValue}`;
      }
      return limitClause;
    } else if (query instanceof OrderByBuilder) {
      return this.getLimitClause(query.query);
    }
    return "";
  }

  private getOrderByClause(query: Queryable<any>): string {
    if (query instanceof OrderByBuilder) {
      const orderFields = query.orderFields
        .map(({ field, direction }) => {
          const tableAlias = this.getRightmostTableAlias(query.query);
          const fieldName = String(field);
          // Use field as-is if it already contains dot notation, otherwise add table alias if available
          const fullFieldName = fieldName.includes(".") ? fieldName : (tableAlias ? `${tableAlias}.${fieldName}` : fieldName);
          return `${fullFieldName} ${direction}`;
        })
        .join(", ");
      return `ORDER BY ${orderFields}`;
    }
    return "";
  }

  private formatValue(value: any): string {
    if (typeof value === "string") {
      return `'${value}'`;
    }
    return String(value);
  }

  toString() {
    // Handle regular field selection
    // When it's mapped from { key: value } the actual output name (the alias) is the key
    const hasJoins = this.queryHasJoins(this.query);

    const fields = Object.entries(this.fields)
      .map(([fieldName, alias]) => {
        // Handle "*" case - don't add table aliases
        if (alias === "*") {
          return "*";
        }

        // Handle true case - use the fieldName as-is with no alias
        if (alias === true) {
          return fieldName;
        }

        // Check if this is a mapped field from join field mapping
        let actualField = fieldName;
        if (hasJoins && this.query instanceof CompoundQueryBuilder && this.query.joinFieldMapping) {
          // If the fieldName exists in the field mapping, use the mapped field name
          if (fieldName in this.query.joinFieldMapping) {
            actualField = String(this.query.joinFieldMapping[fieldName]);
          }
        }

        // Don't add table prefixes - use just the field name
        const fullColumnName = actualField;

        if (fieldName === alias) {
          return fullColumnName;
        }
        return `${fullColumnName} AS ${alias}`;
      })
      .join(", ");
    const source = this.getSource(this.query);
    const whereClause = this.getWhereClause(this.query);
    const orderByClause = this.getOrderByClause(this.query);
    const limitClause = this.getLimitClause(this.query);

    let sql = `SELECT ${fields} FROM ${source}`;
    if (whereClause) {
      sql += ` WHERE ${whereClause}`;
    }
    if (orderByClause) {
      sql += ` ${orderByClause}`;
    }
    if (limitClause) {
      sql += ` ${limitClause}`;
    }
    return sql;
  }
}
