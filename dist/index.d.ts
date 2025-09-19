interface Select<T extends object> {
    select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select(subquery: Query<any>, alias?: string): Select<T>;
    select(fields: Array<keyof T | Partial<Record<keyof T, string>>> | Partial<Record<keyof T, string>> | Query<any>, alias?: string): Select<T>;
    toString(): string;
}

type JoinType = 'INNER' | 'LEFT';
interface Join<T extends object, U extends object> {
    on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}

interface Limit<T extends object> extends Select<T> {
    offset(offsetValue: number): Limit<T>;
}

type OrderDirection = 'ASC' | 'DESC';
interface OrderBy<T extends object> extends Select<T> {
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
    limit(count: number, offset?: number): Limit<T>;
}

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
type OrCondition<T extends object> = {
    type: 'or';
    conditions: Condition<T>;
};
interface Where<T extends object> extends Select<T> {
    where(conditions: WhereCondition<T>): Where<T>;
    or(conditions: Condition<T>): Where<T>;
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
    limit(count: number, offset?: number): any;
}

interface Selectable<T extends object> {
    select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select(subquery: Query<any>, alias?: string): Select<T>;
    select(fields: Array<keyof T | Partial<Record<keyof T, string>>> | Partial<Record<keyof T, string>> | Query<any>, alias?: string): Select<T>;
}
interface Query<T extends object> extends Selectable<T> {
    join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    where(conditions: WhereCondition<T>): Where<T>;
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
}
type WhereCondition<T extends object> = Condition<T> & {
    or?: Array<Condition<T>>;
};

declare class QueryBuilder<T extends object> implements Query<T> {
    readonly tableName: string;
    readonly tableAlias: string;
    constructor(tableName: string, tableAlias?: string);
    select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select(subquery: Query<any>, alias?: string): Select<T>;
    join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    where(conditions: WhereCondition<T>): Where<T>;
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
}

declare const queryBuilder: {
    from<T extends object>(tableName: string, tableAlias?: string): Query<T>;
};

export { QueryBuilder, queryBuilder };
export type { Condition, Join, JoinType, Limit, OrCondition, OrderBy, OrderDirection, Query, Select, Where, WhereCondition };
