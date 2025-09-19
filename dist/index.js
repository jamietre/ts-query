class AliasGenerator {
    static generate() {
        return `t${++this.counter}`;
    }
    static reset() {
        this.counter = 0;
    }
}
AliasGenerator.counter = 0;

class LimitBuilder {
    constructor(query, limit, offset) {
        this.query = query;
        this.limitValue = limit;
        this.offsetValue = offset;
    }
    offset(offsetValue) {
        return new LimitBuilder(this.query, this.limitValue, offsetValue);
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    toString() {
        return this.select(["*"]).toString();
    }
}

class OrderByBuilder {
    constructor(query, field, direction = 'ASC') {
        this.orderFields = [];
        this.query = query;
        this.orderFields = [{ field, direction }];
    }
    orderBy(field, direction = 'ASC') {
        const newOrderFields = [...this.orderFields, { field, direction }];
        const newOrderBy = new OrderByBuilder(this.query, field, direction);
        newOrderBy.orderFields = newOrderFields;
        return newOrderBy;
    }
    select(fields, alias) {
        return new SelectBuilder(this, fields);
    }
    limit(count, offset) {
        return new LimitBuilder(this.query, count, offset);
    }
    toString() {
        return this.select(["*"]).toString();
    }
}

class WhereBuilder {
    constructor(query, conditions, orConditions = []) {
        this.orConditions = [];
        this.query = query;
        this.conditions = conditions;
        this.orConditions = orConditions;
    }
    select(fields, alias) {
        return new SelectBuilder(this, fields);
    }
    join(entity, alias) {
        if (typeof entity === "string") {
            const newQuery = new QueryBuilder(entity, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, "INNER");
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder(`(${entity.toString()})`, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, "INNER");
        }
    }
    innerJoin(entity, alias) {
        return this.join(entity, alias);
    }
    leftJoin(entity, alias) {
        if (typeof entity === "string") {
            const newQuery = new QueryBuilder(entity, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, "LEFT");
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder(`(${entity.toString()})`, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, "LEFT");
        }
    }
    where(conditions) {
        // Merge conditions (simple approach - in real implementation might want more sophisticated merging)
        const mergedConditions = { ...this.conditions, ...conditions };
        return new WhereBuilder(this.query, mergedConditions, this.orConditions);
    }
    or(conditions) {
        const orCondition = {
            type: "or",
            conditions,
        };
        const newOrConditions = [...this.orConditions, orCondition];
        return new WhereBuilder(this.query, this.conditions, newOrConditions);
    }
    orderBy(field, direction = "ASC") {
        return new OrderByBuilder(this, field, direction);
    }
    limit(count, offset) {
        return new LimitBuilder(this, count, offset);
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
                    // Handle string field names
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
    getTableAliasForField(query, _field) {
        // For now, just get the rightmost alias - in a more sophisticated implementation,
        // you might want to track which table each field belongs to
        return this.getRightmostTableAlias(query);
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
    generateSubquerySQL(query) {
        // Generate a basic SELECT * from the subquery to get its full SQL
        if (query instanceof QueryBuilder) {
            return `SELECT * FROM ${query.tableName} AS ${query.tableAlias}`;
        }
        else if (query instanceof CompoundQueryBuilder) {
            const source = this.getSource(query);
            return `SELECT * FROM ${source}`;
        }
        else if (query instanceof WhereBuilder) {
            const source = this.getSource(query.query);
            const whereClause = this.getWhereClause(query);
            let sql = `SELECT * FROM ${source}`;
            if (whereClause) {
                sql += ` WHERE ${whereClause}`;
            }
            return sql;
        }
        else if (query instanceof LimitBuilder) {
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
        }
        else if (query instanceof OrderByBuilder) {
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

class CompoundQueryBuilder {
    constructor(query1, query2, join) {
        this.query1 = query1;
        this.query2 = query2;
        this.joinInfo = join;
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    join(entity, alias) {
        if (typeof entity === 'string') {
            const newQuery = new QueryBuilder(entity, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, 'INNER');
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder(`(${entity.toString()})`, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, 'INNER');
        }
    }
    innerJoin(entity, alias) {
        return this.join(entity, alias);
    }
    leftJoin(entity, alias) {
        if (typeof entity === 'string') {
            const newQuery = new QueryBuilder(entity, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, 'LEFT');
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder(`(${entity.toString()})`, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, 'LEFT');
        }
    }
    where(conditions) {
        return new WhereBuilder(this, conditions);
    }
    orderBy(field, direction = 'ASC') {
        return new OrderByBuilder(this, field, direction);
    }
    toString() {
        return this.select(["*"]).toString();
    }
}

class JoinBuilder {
    constructor(query1, query2, joinType = 'LEFT') {
        this.query1 = query1;
        this.query2 = query2;
        this.joinType = joinType;
    }
    on(condition) {
        this.condition = condition;
        return new CompoundQueryBuilder(this.query1, this.query2, this);
    }
}

class QueryBuilder {
    constructor(tableName, tableAlias) {
        this.tableName = tableName;
        this.tableAlias = tableAlias || AliasGenerator.generate();
    }
    select(fields, alias) {
        return new SelectBuilder(this, fields);
    }
    join(entity, alias) {
        if (typeof entity === 'string') {
            const newQuery = new QueryBuilder(entity, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, "INNER");
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder(`(${entity.toString()})`, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, "INNER");
        }
    }
    innerJoin(entity, alias) {
        return this.join(entity, alias);
    }
    leftJoin(entity, alias) {
        if (typeof entity === 'string') {
            const newQuery = new QueryBuilder(entity, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, "LEFT");
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder(`(${entity.toString()})`, alias || AliasGenerator.generate());
            return new JoinBuilder(this, newQuery, "LEFT");
        }
    }
    where(conditions) {
        return new WhereBuilder(this, conditions);
    }
    orderBy(field, direction = "ASC") {
        return new OrderByBuilder(this, field, direction);
    }
    toString() {
        return this.select(["*"]).toString();
    }
}

// Main entry point for ts-query package
function from(entity, alias) {
    if (typeof entity === "string") {
        return new QueryBuilder(entity, alias || AliasGenerator.generate());
    }
    else {
        // Handle subquery case - create a QueryBuilder that wraps the subquery
        return new QueryBuilder(`(${entity.toString()})`, alias || AliasGenerator.generate());
    }
}
// Create the main query API
const queryBuilder = {
    from,
};

export { queryBuilder };
//# sourceMappingURL=index.js.map
