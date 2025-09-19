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
import { Select } from "./select.js";
import { Join } from "./join.js";
export class Where {
    select(fields, alias) {
        return new Select(this, fields, alias);
    }
    join(tableName, tableAlias) {
        const newQuery = new BaseQuery(tableName, tableAlias);
        return new Join(this, newQuery, 'INNER');
    }
    innerJoin(tableName, tableAlias) {
        return this.join(tableName, tableAlias);
    }
    leftJoin(tableName, tableAlias) {
        const newQuery = new BaseQuery(tableName, tableAlias);
        return new Join(this, newQuery, 'LEFT');
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
}
// Need to import BaseQuery here to avoid circular dependency
import { BaseQuery } from "./query.js";

//# sourceMappingURL=where.js.map