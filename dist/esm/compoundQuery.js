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
import { BaseQuery } from "./query.js";
import { Join } from "./join.js";
import { Select } from "./select.js";
import { Where } from "./where.js";
export class CompoundQuery {
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
        return new Where(this, conditions);
    }
    constructor(query1, query2, join){
        _define_property(this, "query1", void 0);
        _define_property(this, "query2", void 0);
        _define_property(this, "joinInfo", void 0);
        this.query1 = query1;
        this.query2 = query2;
        this.joinInfo = join;
    }
}

//# sourceMappingURL=compoundQuery.js.map