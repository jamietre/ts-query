// Main entry point for ts-query package
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get BaseQuery () {
        return _query.BaseQuery;
    },
    get CompoundQuery () {
        return _compoundQuery.CompoundQuery;
    },
    get Join () {
        return _join.Join;
    },
    get Select () {
        return _select.Select;
    },
    get Where () {
        return _where.Where;
    }
});
const _query = require("./query.cjs");
const _select = require("./select.cjs");
const _where = require("./where.cjs");
const _join = require("./join.cjs");
const _compoundQuery = require("./compoundQuery.cjs");

//# sourceMappingURL=index.cjs.map