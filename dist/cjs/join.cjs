"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Join", {
    enumerable: true,
    get: function() {
        return Join;
    }
});
const _compoundQuery = require("./compoundQuery.cjs");
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
let Join = class Join {
    on(condition) {
        this.condition = condition;
        return new _compoundQuery.CompoundQuery(this.query1, this.query2, this);
    }
    constructor(query1, query2, joinType = 'LEFT'){
        _define_property(this, "query1", void 0);
        _define_property(this, "query2", void 0);
        _define_property(this, "joinType", void 0);
        _define_property(this, "condition", void 0);
        this.query1 = query1;
        this.query2 = query2;
        this.joinType = joinType;
    }
};

//# sourceMappingURL=join.cjs.map