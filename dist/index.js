class LimitBuilder {
    constructor(options) {
        this.query = options.query;
        this.limitValue = options.limit;
        this.offsetValue = options.offset;
    }
    offset(offsetValue) {
        return new LimitBuilder({
            query: this.query,
            limit: this.limitValue,
            offset: offsetValue,
        });
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    toString(options) {
        return this.select(["*"]).toString(options);
    }
}

class OrderByBuilder {
    constructor(options) {
        this.orderFields = [];
        this.query = options.query;
        this.orderFields = [{ field: options.field, direction: options.direction }];
    }
    orderBy(field, direction = "ASC") {
        const newOrderFields = [...this.orderFields, { field, direction }];
        const newOrderBy = new OrderByBuilder({
            query: this.query,
            field,
            direction,
        });
        newOrderBy.orderFields = newOrderFields;
        return newOrderBy;
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    limit(count, offset) {
        return new LimitBuilder({ query: this.query, limit: count, offset });
    }
    toString(options) {
        return this.select(["*"]).toString(options);
    }
}

class WhereBuilder {
    constructor(options) {
        this.orConditions = [];
        this.query = options.query;
        this.conditions = options.conditions;
        this.orConditions = options.orConditions;
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    join(tableName, tableAlias) {
        if (typeof tableName === "string") {
            const newQuery = new QueryBuilder({ tableName, tableAlias });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER", outputOptions: { includeTerminator: true } });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${tableName.toString({ includeTerminator: false })})`,
                tableAlias,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER", outputOptions: { includeTerminator: true } });
        }
    }
    innerJoin(entity, alias) {
        return this.join(entity, alias);
    }
    leftJoin(entity, alias) {
        if (typeof entity === "string") {
            const newQuery = new QueryBuilder({
                tableName: entity,
                tableAlias: alias,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "LEFT", outputOptions: { includeTerminator: true } });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${entity.toString({ includeTerminator: false })})`,
                tableAlias: alias,
            });
            return new JoinBuilder({
                query1: this,
                query2: newQuery,
                joinType: "LEFT",
                outputOptions: { includeTerminator: true },
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
        });
    }
    orderBy(field, direction = "ASC") {
        return new OrderByBuilder({ query: this, field, direction });
    }
    limit(count, offset) {
        return new LimitBuilder({ query: this, limit: count, offset });
    }
    toString(options) {
        return this.select(["*"]).toString(options);
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
    getJoinSource(query) {
        if (query instanceof QueryBuilder) {
            // For JOIN clauses, don't use AS keyword
            const isSubquery = query.tableName.startsWith("(");
            return isSubquery ? `${query.tableName} ${query.tableAlias}` : `${query.tableName} ${query.tableAlias}`;
        }
        else if (query instanceof CompoundQueryBuilder) {
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
        }
        else if (query instanceof WhereBuilder) {
            return this.getJoinSource(query.query);
        }
        else if (query instanceof LimitBuilder) {
            return this.getJoinSource(query.query);
        }
        else if (query instanceof OrderByBuilder) {
            return this.getJoinSource(query.query);
        }
        return "";
    }
    getSource(query) {
        if (query instanceof QueryBuilder) {
            // Only emit alias if the overall query context has joins OR if this is a subquery OR if an alias was explicitly provided
            const hasJoins = this.queryHasJoins(this.query);
            const isSubquery = query.tableName.startsWith("(");
            const hasExplicitAlias = query.tableAlias !== undefined;
            return hasJoins || isSubquery || hasExplicitAlias ?
                (isSubquery ? `${query.tableName} AS ${query.tableAlias}` : `${query.tableName} ${query.tableAlias}`) :
                query.tableName;
        }
        else if (query instanceof CompoundQueryBuilder) {
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
                // Only wrap in parentheses if there are multiple clauses
                return Object.entries(orCondition).length > 1 ? `(${orClauses})` : orClauses;
            });
            // Handle chained OR conditions
            const chainedOrConditions = query.orConditions.map((orCondition) => {
                const orClauses = Object.entries(orCondition.conditions)
                    .map(([key, value]) => {
                    const tableAlias = this.getTableAliasForField(query, key);
                    return this.formatCondition(key, value, tableAlias);
                })
                    .join(" AND ");
                // Only wrap in parentheses if there are multiple clauses
                return Object.entries(orCondition.conditions).length > 1 ? `(${orClauses})` : orClauses;
            });
            // Combine all OR conditions
            const allOrConditions = [...inlineOrClauses, ...chainedOrConditions];
            let allConditions = conditions;
            if (allOrConditions.length > 0) {
                if (allConditions) {
                    // Only wrap main conditions in parentheses if there are multiple main conditions
                    const mainConditionsCount = Object.keys(mainConditions).length;
                    const wrappedMainConditions = mainConditionsCount > 1 ? `(${allConditions})` : allConditions;
                    allConditions = `${wrappedMainConditions} OR ${allOrConditions.join(" OR ")}`;
                }
                else {
                    allConditions = allOrConditions.join(" OR ");
                }
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
    formatValue(value) {
        if (typeof value === "string") {
            return `'${value}'`;
        }
        return String(value);
    }
    toString(options) {
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
        return (options?.includeTerminator ?? true) ? sql + ';' : sql;
    }
}

class CompoundQueryBuilder {
    constructor(options) {
        this.query1 = options.query1;
        this.query2 = options.query2;
        this.joinInfo = options.join;
        this.joinFieldMapping = options.joinFieldMapping;
        this.outputOptions = options.outputOptions;
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    join(target, tableAlias) {
        if (typeof target === "string") {
            const newQuery = new QueryBuilder({ tableName: target, tableAlias });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER", outputOptions: this.outputOptions });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${target.toString({ ...this.outputOptions, includeTerminator: false })})`,
                tableAlias: tableAlias,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "INNER", outputOptions: this.outputOptions });
        }
    }
    innerJoin(tableName, tableAlias) {
        return this.join(tableName, tableAlias);
    }
    leftJoin(tableName, tableAlias) {
        if (typeof tableName === "string") {
            const newQuery = new QueryBuilder({ tableName, tableAlias });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "LEFT", outputOptions: this.outputOptions });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${tableName.toString({ ...this.outputOptions, includeTerminator: false })})`,
                tableAlias: tableAlias,
            });
            return new JoinBuilder({ query1: this, query2: newQuery, joinType: "LEFT", outputOptions: this.outputOptions });
        }
    }
    where(conditions) {
        return new WhereBuilder({ query: this, conditions, orConditions: [] });
    }
    orderBy(field, direction = "ASC") {
        return new OrderByBuilder({ query: this, field, direction });
    }
    limit(count, offset) {
        return new LimitBuilder({ query: this, limit: count, offset });
    }
    toString(options) {
        return this.select(["*"]).toString(options);
    }
}

class JoinBuilder {
    constructor(options) {
        this.query1 = options.query1;
        this.query2 = options.query2;
        this.joinType = options.joinType;
        this.outputOptions = options.outputOptions;
    }
    // Original on() method for immediate join without field selection
    on(condition) {
        this.condition = condition;
        return new CompoundQueryBuilder({
            query1: this.query1,
            query2: this.query2,
            join: this,
            outputOptions: this.outputOptions,
        });
    }
}

class QueryBuilder {
    constructor(options) {
        this.tableName = options.tableName;
        this.tableAlias = options.tableAlias;
    }
    select(fields) {
        return new SelectBuilder(this, fields);
    }
    join(tableName, tableAlias) {
        if (typeof tableName === "string") {
            const newQuery = new QueryBuilder({
                tableName,
                tableAlias,
            });
            return new JoinBuilder({
                query1: this,
                query2: newQuery,
                joinType: "INNER",
                outputOptions: { includeTerminator: true },
            });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${tableName.toString({ includeTerminator: false })})`,
                tableAlias,
            });
            return new JoinBuilder({
                query1: this,
                query2: newQuery,
                joinType: "INNER",
                outputOptions: { includeTerminator: true },
            });
        }
    }
    innerJoin(tableName, tableAlias) {
        return this.join(tableName, tableAlias);
    }
    leftJoin(tableName, tableAlias) {
        if (typeof tableName === "string") {
            const newQuery = new QueryBuilder({
                tableName,
                tableAlias,
            });
            return new JoinBuilder({
                query1: this,
                query2: newQuery,
                joinType: "LEFT",
                outputOptions: { includeTerminator: true },
            });
        }
        else {
            // Handle subquery case - create a QueryBuilder that wraps the subquery
            const newQuery = new QueryBuilder({
                tableName: `(${tableName.toString({ includeTerminator: false })})`,
                tableAlias,
            });
            return new JoinBuilder({
                query1: this,
                query2: newQuery,
                joinType: "LEFT",
                outputOptions: { includeTerminator: true },
            });
        }
    }
    where(conditions) {
        return new WhereBuilder({ query: this, conditions, orConditions: [] });
    }
    orderBy(field, direction = "ASC") {
        return new OrderByBuilder({ query: this, field, direction });
    }
    limit(count, offset) {
        return new LimitBuilder({ query: this, limit: count, offset });
    }
    toString(options) {
        return this.select(["*"]).toString(options);
    }
}

// Main entry point for ts-query package
function from(tableName, tableAlias) {
    if (typeof tableName === "string") {
        return new QueryBuilder({ tableName, tableAlias });
    }
    else {
        // Handle subquery case - create a QueryBuilder that wraps the subquery
        return new QueryBuilder({
            tableName: `(${tableName.toString({ includeTerminator: false })})`,
            tableAlias: tableAlias,
        });
    }
}
// Create the main query API
const queryBuilder = {
    from,
};

export { queryBuilder };
//# sourceMappingURL=index.js.map
