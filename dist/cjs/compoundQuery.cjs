"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CompoundQuery", {
    enumerable: true,
    get: function() {
        return CompoundQuery;
    }
});
const _query = require("./query.cjs");
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
let CompoundQuery = class CompoundQuery {
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
        return new _where.Where(this, conditions);
    }
    constructor(query1, query2, join){
        _define_property(this, "query1", void 0);
        _define_property(this, "query2", void 0);
        _define_property(this, "joinInfo", void 0);
        this.query1 = query1;
        this.query2 = query2;
        this.joinInfo = join;
    }
};

//# sourceMappingURL=compoundQuery.cjs.map