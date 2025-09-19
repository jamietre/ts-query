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

  private getSource(query: Queryable<any>): string {
    if (query instanceof QueryBuilder) {
      // Only emit alias if the overall query context has joins OR if this is a subquery
      const hasJoins = this.queryHasJoins(this.query);
      const isSubquery = query.tableName.startsWith('(');
      return (hasJoins || isSubquery) ? `${query.tableName} AS ${query.tableAlias}` : query.tableName;
    } else if (query instanceof CompoundQueryBuilder) {
      const left = this.getSource(query.query1);
      const right = this.getSource(query.query2);
      const on = Object.entries(query.joinInfo.condition || {})
        .map(([key, value]) => {
          // Get the rightmost table alias from the left side of the join
          const leftAlias = this.getRightmostTableAlias(query.query1);
          const rightAlias = this.getRightmostTableAlias(query.query2);
          return `${leftAlias}.${String(key)} = ${rightAlias}.${String(value)}`;
        })
        .join(" AND ");
      const joinType = query.joinInfo.joinType;
      return `${left} ${joinType} JOIN ${right} ON ${on}`;
    } else if (query instanceof WhereBuilder) {
      return this.getSource(query.query);
    } else if (query instanceof LimitBuilder) {
      return this.getSource(query.query);
    } else if (query instanceof OrderByBuilder) {
      return this.getSource(query.query);
    }
    return "";
  }

  private getRightmostTableAlias(query: Queryable<any>): string {
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

  private formatCondition(key: string, value: any, tableAlias: string): string {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Handle operators like $gt, $lt, etc.
      const entries = Object.entries(value);
      if (entries.length > 0) {
        const [operator, operatorValue] = entries[0];
        switch (operator) {
          case "$eq":
            return `${tableAlias}.${key} = ${this.formatValue(operatorValue)}`;
          case "$gt":
            return `${tableAlias}.${key} > ${this.formatValue(operatorValue)}`;
          case "$lt":
            return `${tableAlias}.${key} < ${this.formatValue(operatorValue)}`;
          case "$gte":
            return `${tableAlias}.${key} >= ${this.formatValue(operatorValue)}`;
          case "$lte":
            return `${tableAlias}.${key} <= ${this.formatValue(operatorValue)}`;
          case "$ne":
            return `${tableAlias}.${key} != ${this.formatValue(operatorValue)}`;
          case "$in":
            return `${tableAlias}.${key} IN (${Array.isArray(operatorValue) ? operatorValue.map((v) => this.formatValue(v)).join(", ") : this.formatValue(operatorValue)})`;
          case "$like":
            return `${tableAlias}.${key} LIKE ${this.formatValue(operatorValue)}`;
          default:
            return `${tableAlias}.${key} = ${this.formatValue(operatorValue)}`;
        }
      }
    }
    return `${tableAlias}.${key} = ${this.formatValue(value)}`;
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

  private getTableAliasForField(query: Queryable<any>, fieldAlias: string): string {
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

  private getLeftmostTableAlias(query: Queryable<any>): string {
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
          return `${tableAlias}.${String(field)} ${direction}`;
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
      .map(([alias, column]) => {
        // Handle "*" case - don't add table aliases
        if (column === "*") {
          return "*";
        }

        // Handle true case - use the alias as the field name with no alias
        if (column === true) {
          let fullColumnName = alias;
          if (hasJoins) {
            const tableAlias = this.getTableAliasForField(this.query, alias);
            fullColumnName = tableAlias ? `${tableAlias}.${alias}` : alias;
          }
          return fullColumnName;
        }

        // Check if this is a mapped field from join field mapping
        let actualField = column;
        if (hasJoins && this.query instanceof CompoundQueryBuilder && this.query.joinFieldMapping) {
          // If the alias exists in the field mapping, use the mapped field name
          if (alias in this.query.joinFieldMapping) {
            actualField = String(this.query.joinFieldMapping[alias]);
          }
        }

        // Only add table aliases if there are joins
        let fullColumnName = actualField;
        if (hasJoins) {
          const tableAlias = this.getTableAliasForField(this.query, alias);
          fullColumnName = tableAlias ? `${tableAlias}.${actualField}` : actualField;
        }

        if (alias === actualField) {
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
