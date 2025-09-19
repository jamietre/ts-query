import { Join } from "./join.js";
import { Select } from "./select.js";
import { Where, WhereCondition } from "./where.js";
export interface Query<T extends object> {
    select(fields: Array<keyof T>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select(subquery: Query<any>, alias?: string): Select<T>;
    select(fields: Array<keyof T> | Partial<Record<keyof T, string>> | Query<any>, alias?: string): Select<T>;
    join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    where(conditions: WhereCondition<T>): Where<T>;
}
export declare class BaseQuery<T extends object> implements Query<T> {
    readonly tableName: string;
    readonly tableAlias: string;
    static from<T extends object>(tableName: string, tableAlias?: string): BaseQuery<T>;
    constructor(tableName: string, tableAlias?: string);
    select(fields: Array<keyof T>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select(subquery: Query<any>, alias?: string): Select<T>;
    join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    where(conditions: WhereCondition<T>): Where<T>;
}
//# sourceMappingURL=query.d.ts.map