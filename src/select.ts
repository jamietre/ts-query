import { CompoundQueryBuilder } from "./compoundQuery.js";
import { QueryBuilder } from "./query.js";
import { WhereBuilder } from "./where.js";
import { LimitBuilder } from "./limit.js";
import { OrderByBuilder } from "./orderBy.js";
import type { Query, Queryable } from "./types/query.js";
import type { Limit } from "./types/limit.js";
import type { OrderBy } from "./types/orderBy.js";
import type { Select } from "./types/select.js";
export class SelectBuilder<T extends object> implements Select<T> {
  query: Queryable<T>;
  fields: Partial<Record<keyof T, string>> = {};

  constructor(query: Queryable<T>, fields: any) {
    this.query = query;

    if (Array.isArray(fields)) {
      fields.forEach((field: keyof T | Partial<Record<keyof T, string>>) => {
        if (typeof field === "string" || typeof field === "symbol" || typeof field === "number") {
          // Handle string field names
          this.fields[field as keyof T] = field as string;
        } else if (typeof field === "object" && field !== null) {
          // Handle object with field mappings
          Object.entries(field).forEach(([key, value]) => {
            this.fields[key as keyof T] = value as string;
          });
        }
      });
      return;
    }

    if (fields && typeof fields === "object") {
      Object.entries(fields).forEach(([key, value]) => {
        this.fields[key as keyof T] = value as string;
      });
    }
  }
  select(fields: (keyof T | Partial<Record<keyof T, string>>)[]): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(fields: Partial<Record<keyof T, string>> | (keyof T | Partial<Record<keyof T, string>>)[]): Select<T> {
    return new SelectBuilder<T>(this.query, fields);
  }

  private getSource(query: Queryable<any>): string {
    if (query instanceof QueryBuilder) {
      return `${query.tableName} AS ${query.tableAlias}`;
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

  private getTableAliasForField(query: Queryable<any>, _field: string): string {
    // For now, just get the rightmost alias - in a more sophisticated implementation,
    // you might want to track which table each field belongs to
    return this.getRightmostTableAlias(query);
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

  private generateSubquerySQL(query: Queryable<any>): string {
    // Generate a basic SELECT * from the subquery to get its full SQL
    if (query instanceof QueryBuilder) {
      return `SELECT * FROM ${query.tableName} AS ${query.tableAlias}`;
    } else if (query instanceof CompoundQueryBuilder) {
      const source = this.getSource(query);
      return `SELECT * FROM ${source}`;
    } else if (query instanceof WhereBuilder) {
      const source = this.getSource(query.query);
      const whereClause = this.getWhereClause(query);
      let sql = `SELECT * FROM ${source}`;
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
      return sql;
    } else if (query instanceof LimitBuilder) {
      const source = this.getSource(query.query);
      const whereClause = this.getWhereClause(query.query);
      const limitClause = this.getLimitClause(query);
      let sql = `SELECT * FROM ${source}`;
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
      if (limitClause) {
        sql += ` ${limitClause}`;
      }
      return sql;
    } else if (query instanceof OrderByBuilder) {
      const source = this.getSource(query.query);
      const whereClause = this.getWhereClause(query.query);
      const orderByClause = this.getOrderByClause(query);
      const limitClause = this.getLimitClause(query.query);
      let sql = `SELECT * FROM ${source}`;
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
    return "SELECT *";
  }

  toString() {
    // Handle regular field selection
    const fields = Object.entries(this.fields)
      .map(([column, alias]) => {
        if (column === alias) {
          return column;
        }
        return `${column} AS ${alias}`;
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
