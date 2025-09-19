'use strict';

class AliasGenerator {
    constructor() {
        this.counter = 0;
    }
    generate() {
        return `t${++this.counter}`;
    }
    reset() {
        this.counter = 0;
    }
}

class LimitBuilder {
    constructor(options) {
        this.query = options.query;
        this.limitValue = options.limit;
        this.offsetValue = options.offset;
        this.aliasGenerator = options.aliasGenerator;
    }
    offset(offsetValue) {
        return new LimitBuilder({
            query: this.query,
            limit: this.limitValue,
            offset: offsetValue,
            aliasGenerator: this.aliasGenerator,
        });
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    toString() {
        return this.select(["*"]).toString();
    }
}

class OrderByBuilder {
    constructor(options) {
        this.orderFields = [];
        this.query = options.query;
        this.orderFields = [{ field: options.field, direction: options.direction }];
        this.aliasGenerator = options.aliasGenerator;
    }
    orderBy(field, direction = "ASC") {
        const newOrderFields = [...this.orderFields, { field, direction }];
        const newOrderBy = new OrderByBuilder({
            query: this.query,
            field,
            direction,
            aliasGenerator: this.aliasGenerator,
        });
        newOrderBy.orderFields = newOrderFields;
        return newOrderBy;
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    limit(count, offset) {
        return new LimitBuilder({ query: this.query, limit: count, offset, aliasGenerator: this.aliasGenerator });
    }
    toString() {
        return this.select(["*"]).toString();
    }
}

class WhereBuilder {
    constructor(options) {
        this.orConditions = [];
        this.query = options.query;
        this.conditions = options.conditions;
        this.orConditions = options.orConditions;
        this.aliasGenerator = options.aliasGenerator;
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    join(tableName, tableAlias) {
        if (typeof tableName === "string") {
            const newQuery = new QueryBuilder({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER" });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${tableName.toString()})`,
                tableAlias,
                aliasGenerator: this.aliasGenerator,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER" });
        }
    }
    innerJoin(entity, alias) {
        return this.join(entity, alias);
    }
    leftJoin(entity, alias) {
        if (typeof entity === "string") {
            const newQuery = new QueryBuilder({
                tableName: entity,
                tableAlias: alias || new AliasGenerator().generate(),
                aliasGenerator: this.aliasGenerator,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "LEFT" });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${entity.toString()})`,
                tableAlias: alias || new AliasGenerator().generate(),
                aliasGenerator: this.aliasGenerator,
            });
            return new JoinBuilder({
                query1: this,
                query2: newQuery,
                joinType: "LEFT",
                aliasGenerator: this.aliasGenerator,
            });
        }
    }
    where(conditions) {
        // Merge conditions (simple approach - in real implementation might want more sophisticated merging)
        const mergedConditions = { ...this.conditions, ...conditions };
        return new WhereBuilder({
            query: this.query,
            conditions: mergedConditions,
            orConditions: this.orConditions,
            aliasGenerator: this.aliasGenerator,
        });
    }
    or(conditions) {
        const orCondition = {
            type: "or",
            conditions,
        };
        const newOrConditions = [...this.orConditions, orCondition];
        return new WhereBuilder({
            query: this.query,
            conditions: this.conditions,
            orConditions: newOrConditions,
            aliasGenerator: this.aliasGenerator,
        });
    }
    orderBy(field, direction = "ASC") {
        return new OrderByBuilder({ query: this, field, direction, aliasGenerator: this.aliasGenerator });
    }
    limit(count, offset) {
        return new LimitBuilder({ query: this, limit: count, offset, aliasGenerator: this.aliasGenerator });
    }
    toString() {
        return this.select(["*"]).toString();
    }
}

class SelectBuilder {
    constructor(query, fields) {
        this.fields = {};
        this.query = query;
        if (Array.isArray(fields)) {
            fields.forEach((field) => {
                if (typeof field === "string" || typeof field === "symbol" || typeof field === "number") {
                    // Handle string field names (including "*")
                    this.fields[field] = field;
                }
                else if (typeof field === "object" && field !== null) {
                    // Handle object with field mappings
                    Object.entries(field).forEach(([key, value]) => {
                        this.fields[key] = value;
                    });
                }
            });
            return;
        }
        if (fields && typeof fields === "object") {
            Object.entries(fields).forEach(([key, value]) => {
                this.fields[key] = value;
            });
        }
    }
    select(fields) {
        return new SelectBuilder(this.query, fields);
    }
    getSource(query) {
        if (query instanceof QueryBuilder) {
            return `${query.tableName} AS ${query.tableAlias}`;
        }
        else if (query instanceof CompoundQueryBuilder) {
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
        }
        else if (query instanceof WhereBuilder) {
            return this.getSource(query.query);
        }
        else if (query instanceof LimitBuilder) {
            return this.getSource(query.query);
        }
        else if (query instanceof OrderByBuilder) {
            return this.getSource(query.query);
        }
        return "";
    }
    getRightmostTableAlias(query) {
        if (query instanceof QueryBuilder) {
            return query.tableAlias;
        }
        else if (query instanceof CompoundQueryBuilder) {
            // For compound queries, get the rightmost table alias (the most recently joined table)
            return this.getRightmostTableAlias(query.query2);
        }
        else if (query instanceof WhereBuilder) {
            return this.getRightmostTableAlias(query.query);
        }
        else if (query instanceof LimitBuilder) {
            return this.getRightmostTableAlias(query.query);
        }
        else if (query instanceof OrderByBuilder) {
            return this.getRightmostTableAlias(query.query);
        }
        return "";
    }
    formatCondition(key, value, tableAlias) {
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
    getWhereClause(query) {
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
        }
        else if (query instanceof LimitBuilder) {
            return this.getWhereClause(query.query);
        }
        else if (query instanceof OrderByBuilder) {
            return this.getWhereClause(query.query);
        }
        return "";
    }
    getTableAliasForField(query, fieldAlias) {
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
    getLeftmostTableAlias(query) {
        if (query instanceof QueryBuilder) {
            return query.tableAlias;
        }
        else if (query instanceof CompoundQueryBuilder) {
            // For compound queries, get the leftmost table alias (the base table)
            return this.getLeftmostTableAlias(query.query1);
        }
        else if (query instanceof WhereBuilder) {
            return this.getLeftmostTableAlias(query.query);
        }
        else if (query instanceof LimitBuilder) {
            return this.getLeftmostTableAlias(query.query);
        }
        else if (query instanceof OrderByBuilder) {
            return this.getLeftmostTableAlias(query.query);
        }
        return "";
    }
    queryHasJoins(query) {
        if (query instanceof QueryBuilder) {
            return false; // Single table, no joins
        }
        else if (query instanceof CompoundQueryBuilder) {
            return true; // CompoundQueryBuilder indicates a join
        }
        else if (query instanceof WhereBuilder) {
            return this.queryHasJoins(query.query);
        }
        else if (query instanceof LimitBuilder) {
            return this.queryHasJoins(query.query);
        }
        else if (query instanceof OrderByBuilder) {
            return this.queryHasJoins(query.query);
        }
        return false;
    }
    getLimitClause(query) {
        if (query instanceof LimitBuilder) {
            let limitClause = `LIMIT ${query.limitValue}`;
            if (query.offsetValue !== undefined) {
                limitClause += ` OFFSET ${query.offsetValue}`;
            }
            return limitClause;
        }
        else if (query instanceof OrderByBuilder) {
            return this.getLimitClause(query.query);
        }
        return "";
    }
    getOrderByClause(query) {
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
    formatValue(value) {
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

class CompoundQueryBuilder {
    constructor(options) {
        this.query1 = options.query1;
        this.query2 = options.query2;
        this.joinInfo = options.join;
        this.joinFieldMapping = options.joinFieldMapping;
        this.aliasGenerator = options.aliasGenerator;
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    join(tableName, tableAlias) {
        if (typeof tableName === "string") {
            const newQuery = new QueryBuilder({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER" });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${tableName.toString()})`,
                aliasGenerator: this.aliasGenerator,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER" });
        }
    }
    innerJoin(tableName, tableAlias) {
        return this.join(tableName, tableAlias);
    }
    leftJoin(tableName, tableAlias) {
        if (typeof tableName === "string") {
            const newQuery = new QueryBuilder({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "LEFT" });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${tableName.toString()})`,
                tableAlias: tableAlias,
                aliasGenerator: this.aliasGenerator,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "LEFT" });
        }
    }
    where(conditions) {
        return new WhereBuilder({ query: this, conditions, orConditions: [], aliasGenerator: this.aliasGenerator });
    }
    orderBy(field, direction = "ASC") {
        return new OrderByBuilder({ query: this, field, direction, aliasGenerator: this.aliasGenerator });
    }
    limit(count, offset) {
        return new LimitBuilder({ query: this, limit: count, offset, aliasGenerator: this.aliasGenerator });
    }
    toString() {
        return this.select(["*"]).toString();
    }
}

class JoinWithFieldsBuilder {
    constructor(options) {
        this.query1 = options.query1;
        this.query2 = options.query2;
        this.joinBuilder = options.joinBuilder;
        this.selectedFields = options.selectedFields;
    }
    on(condition) {
        // Set the condition on the original join builder
        this.joinBuilder.condition = condition;
        // Determine if we have field mappings
        const joinFieldMapping = !Array.isArray(this.selectedFields) ? this.selectedFields : undefined;
        // Create the compound query builder with the selected fields information
        return new CompoundQueryBuilder({
            query1: this.query1,
            query2: this.query2,
            join: this.joinBuilder,
            aliasGenerator: this.joinBuilder.aliasGenerator,
            joinFieldMapping,
        });
    }
}

class JoinBuilder {
    constructor(options) {
        this.aliasGenerator = new AliasGenerator();
        this.query1 = options.query1;
        this.query2 = options.query2;
        this.joinType = options.joinType;
        this.aliasGenerator = options.aliasGenerator || new AliasGenerator();
    }
    alias(fields) {
        return new JoinWithFieldsBuilder({
            query1: this.query1,
            query2: this.query2,
            joinBuilder: this,
            selectedFields: fields,
        });
    }
    // Original on() method for immediate join without field selection
    on(condition) {
        this.condition = condition;
        return new CompoundQueryBuilder({
            query1: this.query1,
            query2: this.query2,
            join: this,
            aliasGenerator: this.aliasGenerator,
        });
    }
}

class QueryBuilder {
    constructor(options) {
        this.aliasGenerator = options.aliasGenerator;
        this.tableName = options.tableName;
        this.tableAlias = options.tableAlias || this.aliasGenerator.generate();
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    join(tableName, tableAlias) {
        if (typeof tableName === "string") {
            const newQuery = new QueryBuilder({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER" });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${tableName.toString()})`,
                aliasGenerator: this.aliasGenerator,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER" });
        }
    }
    innerJoin(entity, alias) {
        return this.join(entity, alias);
    }
    leftJoin(tableName, tableAlias) {
        if (typeof tableName === "string") {
            const newQuery = new QueryBuilder({ tableName, tableAlias, aliasGenerator: this.aliasGenerator });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "LEFT" });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${tableName.toString()})`,
                aliasGenerator: this.aliasGenerator,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "LEFT" });
        }
    }
    where(conditions) {
        return new WhereBuilder({ query: this, conditions, orConditions: [], aliasGenerator: this.aliasGenerator });
    }
    orderBy(field, direction = "ASC") {
        return new OrderByBuilder({ query: this, field, direction, aliasGenerator: this.aliasGenerator });
    }
    limit(count, offset) {
        return new LimitBuilder({ query: this, limit: count, offset, aliasGenerator: this.aliasGenerator });
    }
    toString() {
        return this.select(["*"]).toString();
    }
}

// Main entry point for ts-query package
function from(tableName, tableAlias) {
    if (typeof tableName === "string") {
        return new QueryBuilder({ tableName, tableAlias, aliasGenerator: new AliasGenerator() });
    }
    else {
        // Handle subquery case - create a QueryBuilder that wraps the subquery
        return new QueryBuilder({
            tableName: `(${tableName.toString()})`,
            tableAlias: tableAlias || new AliasGenerator().generate(),
            aliasGenerator: new AliasGenerator(),
        });
    }
}
// Create the main query API
const queryBuilder = {
    from,
};

exports.queryBuilder = queryBuilder;
//# sourceMappingURL=index.cjs.map
