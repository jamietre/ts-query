"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BaseQuery", {
    enumerable: true,
    get: function() {
        return BaseQuery;
    }
});
const _join = require("./join.cjs");
const _select = require("./select.cjs");
const _where = require("./where.cjs");
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
let AliasGenerator = class AliasGenerator {
    static generate() {
        return `t${++this.counter}`;
    }
    static reset() {
        this.counter = 0;
    }
};
_define_property(AliasGenerator, "counter", 0);
let BaseQuery = class BaseQuery {
    static from(tableName, tableAlias) {
        return new BaseQuery(tableName, tableAlias || AliasGenerator.generate());
    }
    select(fields, alias) {
        return new _select.Select(this, fields, alias);
    }
    join(tableName, tableAlias) {
        const newQuery = new BaseQuery(tableName, tableAlias || AliasGenerator.generate());
        return new _join.Join(this, newQuery, 'INNER');
    }
    innerJoin(tableName, tableAlias) {
        return this.join(tableName, tableAlias);
    }
    leftJoin(tableName, tableAlias) {
        const newQuery = new BaseQuery(tableName, tableAlias || AliasGenerator.generate());
        return new _join.Join(this, newQuery, 'LEFT');
    }
    where(conditions) {
        return new _where.Where(this, conditions);
    }
    constructor(tableName, tableAlias){
        _define_property(this, "tableName", void 0);
        _define_property(this, "tableAlias", void 0);
        this.tableName = tableName;
        this.tableAlias = tableAlias || AliasGenerator.generate();
    }
};

//# sourceMappingURL=query.cjs.map