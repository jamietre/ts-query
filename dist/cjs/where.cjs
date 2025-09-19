"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Where", {
    enumerable: true,
    get: function() {
        return Where;
    }
});
const _select = require("./select.cjs");
const _join = require("./join.cjs");
const _query = require("./query.cjs");
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
let Where = class Where {
    select(fields, alias) {
        return new _select.Select(this, fields, alias);
    }
    join(tableName, tableAlias) {
        const newQuery = new _query.BaseQuery(tableName, tableAlias);
        return new _join.Join(this, newQuery, 'INNER');
    }
    innerJoin(tableName, tableAlias) {
        return this.join(tableName, tableAlias);
    }
    leftJoin(tableName, tableAlias) {
        const newQuery = new _query.BaseQuery(tableName, tableAlias);
        return new _join.Join(this, newQuery, 'LEFT');
    }
    where(conditions) {
        // Merge conditions (simple approach - in real implementation might want more sophisticated merging)
        const mergedConditions = {
            ...this.conditions,
            ...conditions
        };
        return new Where(this.query, mergedConditions, this.orConditions);
    }
    or(conditions) {
        const orCondition = {
            type: 'or',
            conditions
        };
        const newOrConditions = [
            ...this.orConditions,
            orCondition
        ];
        return new Where(this.query, this.conditions, newOrConditions);
    }
    constructor(query, conditions, orConditions = []){
        _define_property(this, "query", void 0);
        _define_property(this, "conditions", void 0);
        _define_property(this, "orConditions", []);
        this.query = query;
        this.conditions = conditions;
        this.orConditions = orConditions;
    }
};

//# sourceMappingURL=where.cjs.map