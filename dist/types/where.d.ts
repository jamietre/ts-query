import { Query } from "./query.js";
import { Select } from "./select.js";
import { Join } from "./join.js";
type Condition<T extends object> = {
    [K in keyof T]?: T[K] | {
        $eq: T[K];
    } | {
        $gt: T[K];
    } | {
        $lt: T[K];
    } | {
        $gte: T[K];
    } | {
        $lte: T[K];
    } | {
        $ne: T[K];
    } | {
        $in: T[K][];
    } | {
        $like: string;
    };
};
export type WhereCondition<T extends object> = Condition<T> & {
    "or"?: Array<Condition<T>>;
};
export type OrCondition<T extends object> = {
    type: 'or';
    conditions: Condition<T>;
};
export declare class Where<T extends object> implements Query<T> {
    readonly query: Query<T>;
    readonly conditions: WhereCondition<T>;
    readonly orConditions: OrCondition<T>[];
    constructor(query: Query<T>, conditions: WhereCondition<T>, orConditions?: OrCondition<T>[]);
    select(fields: Array<keyof T>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select(subquery: Query<any>, alias?: string): Select<T>;
    join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    where(conditions: WhereCondition<T>): Where<T>;
    or(conditions: Condition<T>): Where<T>;
}
export {};
//# sourceMappingURL=where.d.ts.map