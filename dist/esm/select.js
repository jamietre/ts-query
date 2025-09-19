function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { CompoundQuery } from "./compoundQuery.js";
import { BaseQuery } from "./query.js";
import { Where } from "./where.js";
// Access the AliasGenerator from query.ts
const AliasGenerator = {
    counter: 0,
    generate () {
        return `s${++this.counter}`;
    }
};
export class Select {
    getSource(query) {
        if (query instanceof BaseQuery) {
            return `${query.tableName} AS ${query.tableAlias}`;
        } else if (query instanceof CompoundQuery) {
            const left = this.getSource(query.query1);
            const right = this.getSource(query.query2);
            const on = Object.entries(query.joinInfo.condition || {}).map(([key, value])=>{
                // Get the rightmost table alias from the left side of the join
                const leftAlias = this.getRightmostTableAlias(query.query1);
                const rightAlias = this.getRightmostTableAlias(query.query2);
                return `${leftAlias}.${String(key)} = ${rightAlias}.${String(value)}`;
            }).join(" AND ");
            const joinType = query.joinInfo.joinType;
            return `${left} ${joinType} JOIN ${right} ON ${on}`;
        } else if (query instanceof Where) {
            return this.getSource(query.query);
        }
        return "";
    }
    getRightmostTableAlias(query) {
        if (query instanceof BaseQuery) {
            return query.tableAlias;
        } else if (query instanceof CompoundQuery) {
            // For compound queries, get the rightmost table alias (the most recently joined table)
            return this.getRightmostTableAlias(query.query2);
        } else if (query instanceof Where) {
            return this.getRightmostTableAlias(query.query);
        }
        return "";
    }
    formatCondition(key, value, tableAlias) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Handle operators like $gt, $lt, etc.
            const entries = Object.entries(value);
            if (entries.length > 0) {
                const [operator, operatorValue] = entries[0];
                switch(operator){
                    case '$eq':
                        return `${tableAlias}.${key} = ${this.formatValue(operatorValue)}`;
                    case '$gt':
                        return `${tableAlias}.${key} > ${this.formatValue(operatorValue)}`;
                    case '$lt':
                        return `${tableAlias}.${key} < ${this.formatValue(operatorValue)}`;
                    case '$gte':
                        return `${tableAlias}.${key} >= ${this.formatValue(operatorValue)}`;
                    case '$lte':
                        return `${tableAlias}.${key} <= ${this.formatValue(operatorValue)}`;
                    case '$ne':
                        return `${tableAlias}.${key} != ${this.formatValue(operatorValue)}`;
                    case '$in':
                        return `${tableAlias}.${key} IN (${Array.isArray(operatorValue) ? operatorValue.map((v)=>this.formatValue(v)).join(', ') : this.formatValue(operatorValue)})`;
                    case '$like':
                        return `${tableAlias}.${key} LIKE ${this.formatValue(operatorValue)}`;
                    default:
                        return `${tableAlias}.${key} = ${this.formatValue(operatorValue)}`;
                }
            }
        }
        return `${tableAlias}.${key} = ${this.formatValue(value)}`;
    }
    getWhereClause(query) {
        if (query instanceof Where) {
            // Extract the inline "or" conditions from the main conditions
            const { or: inlineOrConditions, ...mainConditions } = query.conditions;
            // Process main conditions (excluding "or")
            const conditions = Object.entries(mainConditions).map(([key, value])=>{
                const tableAlias = this.getTableAliasForField(query, key);
                return this.formatCondition(key, value, tableAlias);
            }).join(' AND ');
            // Handle inline OR conditions
            const inlineOrClauses = (inlineOrConditions || []).map((orCondition)=>{
                const orClauses = Object.entries(orCondition).map(([key, value])=>{
                    const tableAlias = this.getTableAliasForField(query, key);
                    return this.formatCondition(key, value, tableAlias);
                }).join(' AND ');
                return `(${orClauses})`;
            });
            // Handle chained OR conditions
            const chainedOrConditions = query.orConditions.map((orCondition)=>{
                const orClauses = Object.entries(orCondition.conditions).map(([key, value])=>{
                    const tableAlias = this.getTableAliasForField(query, key);
                    return this.formatCondition(key, value, tableAlias);
                }).join(' AND ');
                return `(${orClauses})`;
            });
            // Combine all OR conditions
            const allOrConditions = [
                ...inlineOrClauses,
                ...chainedOrConditions
            ];
            let allConditions = conditions;
            if (allOrConditions.length > 0) {
                allConditions = allConditions ? `(${allConditions}) OR ${allOrConditions.join(' OR ')}` : allOrConditions.join(' OR ');
            }
            const nestedWhere = this.getWhereClause(query.query);
            return nestedWhere ? `${allConditions} AND ${nestedWhere}` : allConditions;
        }
        return '';
    }
    getTableAliasForField(query, _field) {
        // For now, just get the rightmost alias - in a more sophisticated implementation,
        // you might want to track which table each field belongs to
        return this.getRightmostTableAlias(query);
    }
    formatValue(value) {
        if (typeof value === 'string') {
            return `'${value}'`;
        }
        return String(value);
    }
    generateSubquerySQL(query) {
        // Generate a basic SELECT * from the subquery to get its full SQL
        if (query instanceof BaseQuery) {
            return `SELECT * FROM ${query.tableName} AS ${query.tableAlias}`;
        } else if (query instanceof CompoundQuery) {
            const source = this.getSource(query);
            return `SELECT * FROM ${source}`;
        } else if (query instanceof Where) {
            const source = this.getSource(query.query);
            const whereClause = this.getWhereClause(query);
            let sql = `SELECT * FROM ${source}`;
            if (whereClause) {
                sql += ` WHERE ${whereClause}`;
            }
            return sql;
        }
        return 'SELECT *';
    }
    toString() {
        // Handle subquery case
        if (this.subquery && this.subqueryAlias) {
            const subquerySQL = this.generateSubquerySQL(this.subquery);
            const source = this.getSource(this.query);
            const whereClause = this.getWhereClause(this.query);
            let sql = `SELECT (${subquerySQL}) AS ${this.subqueryAlias} FROM ${source}`;
            if (whereClause) {
                sql += ` WHERE ${whereClause}`;
            }
            return sql;
        }
        // Handle regular field selection
        const fields = Object.entries(this.fields).map(([column, alias])=>{
            if (column === alias) {
                return column;
            }
            return `${column} AS ${alias}`;
        }).join(", ");
        const source = this.getSource(this.query);
        const whereClause = this.getWhereClause(this.query);
        let sql = `SELECT ${fields} FROM ${source}`;
        if (whereClause) {
            sql += ` WHERE ${whereClause}`;
        }
        return sql;
    }
    constructor(query, fields, alias){
        _define_property(this, "query", void 0);
        _define_property(this, "fields", {});
        _define_property(this, "subquery", void 0);
        _define_property(this, "subqueryAlias", void 0);
        this.query = query;
        // Check if fields is actually a Query (subquery)
        if (fields && typeof fields === 'object' && 'select' in fields && typeof fields.select === 'function') {
            this.subquery = fields;
            this.subqueryAlias = alias || AliasGenerator.generate();
            return;
        }
        if (Array.isArray(fields)) {
            fields.forEach((field)=>{
                this.fields[field] = field;
            });
            return;
        }
        if (fields && typeof fields === 'object') {
            Object.entries(fields).forEach(([key, value])=>{
                this.fields[key] = value;
            });
        }
        return;
    }
}

//# sourceMappingURL=select.js.map