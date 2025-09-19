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
import { Join } from "./join.js";
import { Select } from "./select.js";
import { Where } from "./where.js";
let AliasGenerator = class AliasGenerator {
    static generate() {
        return `t${++this.counter}`;
    }
    static reset() {
        this.counter = 0;
    }
};
_define_property(AliasGenerator, "counter", 0);
export class BaseQuery {
    static from(tableName, tableAlias) {
        return new BaseQuery(tableName, tableAlias || AliasGenerator.generate());
    }
    select(fields, alias) {
        return new Select(this, fields, alias);
    }
    join(tableName, tableAlias) {
        const newQuery = new BaseQuery(tableName, tableAlias || AliasGenerator.generate());
        return new Join(this, newQuery, 'INNER');
    }
    innerJoin(tableName, tableAlias) {
        return this.join(tableName, tableAlias);
    }
    leftJoin(tableName, tableAlias) {
        const newQuery = new BaseQuery(tableName, tableAlias || AliasGenerator.generate());
        return new Join(this, newQuery, 'LEFT');
    }
    where(conditions) {
        return new Where(this, conditions);
    }
    constructor(tableName, tableAlias){
        _define_property(this, "tableName", void 0);
        _define_property(this, "tableAlias", void 0);
        this.tableName = tableName;
        this.tableAlias = tableAlias || AliasGenerator.generate();
    }
}

//# sourceMappingURL=query.js.map