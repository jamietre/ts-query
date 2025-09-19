import { Query } from "./query.js";
import { Join } from "./join.js";
import { Select } from "./select.js";
import { Where, WhereCondition } from "./where.js";
export declare class CompoundQuery<T extends object, U extends object> implements Query<T & U> {
    readonly query1: Query<T>;
    readonly query2: Query<U>;
    readonly joinInfo: Join<T, U>;
    constructor(query1: Query<T>, query2: Query<U>, join: Join<T, U>);
    select(fields: Array<keyof T & U>): Select<T & U>;
    select(fields: Partial<Record<keyof T | keyof U, string>>): Select<T & U>;
    select(subquery: Query<any>, alias?: string): Select<T & U>;
    join<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V>;
    innerJoin<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V>;
    leftJoin<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V>;
    where(conditions: WhereCondition<T & U>): Where<T & U>;
}
//# sourceMappingURL=compoundQuery.d.ts.map