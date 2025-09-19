interface Select<T extends object> {
    toString(): string;
}

type JoinType$1 = 'INNER' | 'LEFT';
interface Join<T extends object, U extends object> {
    on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}

interface Where<T extends object> extends Selectable<T> {
    or(conditions: any): Where<T>;
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
    where(conditions: WhereCondition$1<T>): Where<T>;
}
type WhereCondition$1<T extends object> = {
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
} & {
    "or"?: Array<Condition$1<T>>;
};
type Condition$1<T extends object> = {
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
type OrCondition$1<T extends object> = {
    type: 'or';
    conditions: Condition$1<T>;
};

declare class QueryBuilder<T extends object> implements Query<T> {
    readonly tableName: string;
    readonly tableAlias: string;
    static from<T extends object>(tableName: string, tableAlias?: string): QueryBuilder<T>;
    constructor(tableName: string, tableAlias?: string);
    select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select(subquery: Query<any>, alias?: string): Select<T>;
    join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    where(conditions: WhereCondition$1<T>): Where<T>;
}

interface Limit<T extends object> extends Selectable<T> {
    offset(offsetValue: number): Limit<T>;
}

declare class SelectBuilder<T extends object> {
    query: Query<T> | Limit<T>;
    fields: Partial<Record<keyof T, string>>;
    subquery?: Query<any>;
    subqueryAlias?: string;
    constructor(query: Query<T> | Limit<T>, fields: any, alias?: string);
    private getSource;
    private getRightmostTableAlias;
    private formatCondition;
    private getWhereClause;
    private getTableAliasForField;
    private getLimitClause;
    private formatValue;
    private generateSubquerySQL;
    toString(): string;
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
type WhereCondition<T extends object> = Condition<T> & {
    "or"?: Array<Condition<T>>;
};
type OrCondition<T extends object> = {
    type: 'or';
    conditions: Condition<T>;
};
declare class WhereBuilder<T extends object> implements Query<T> {
    readonly query: Query<T>;
    readonly conditions: WhereCondition<T>;
    readonly orConditions: OrCondition<T>[];
    constructor(query: Query<T>, conditions: WhereCondition<T>, orConditions?: OrCondition<T>[]);
    select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select(subquery: Query<any>, alias?: string): Select<T>;
    join<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    innerJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    leftJoin<U extends object>(tableName: string, tableAlias?: string): Join<T, U>;
    where(conditions: WhereCondition<T>): Where<T>;
    or(conditions: Condition<T>): Where<T>;
    limit(count: number, offset?: number): Limit<T>;
}

type JoinType = 'INNER' | 'LEFT';
declare class JoinBuilder<T extends object, U extends object> {
    readonly query1: Query<T>;
    readonly query2: Query<U>;
    readonly joinType: JoinType;
    condition?: Partial<Record<keyof T, keyof U>>;
    constructor(query1: Query<T>, query2: Query<U>, joinType?: JoinType);
    on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}

declare class CompoundQueryBuilder<T extends object, U extends object> implements Query<T & U> {
    readonly query1: Query<T>;
    readonly query2: Query<U>;
    readonly joinInfo: JoinBuilder<T, U>;
    constructor(query1: Query<T>, query2: Query<U>, join: JoinBuilder<T, U>);
    select(fields: Array<keyof T & U>): Select<T & U>;
    select(fields: Partial<Record<keyof T | keyof U, string>>): Select<T & U>;
    select(subquery: Query<any>, alias?: string): Select<T & U>;
    join<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V>;
    innerJoin<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V>;
    leftJoin<V extends object>(tableName: string, tableAlias?: string): Join<T & U, V>;
    where(conditions: WhereCondition$1<T & U>): Where<T & U>;
}

declare class LimitBuilder<T extends object> implements Selectable<T> {
    query: Query<T>;
    limitValue: number;
    offsetValue?: number;
    constructor(query: Query<T>, limit: number, offset?: number);
    offset(offsetValue: number): Limit<T>;
    select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select(subquery: Query<any>, alias?: string): Select<T>;
}

declare class AliasGenerator {
    private static counter;
    static generate(): string;
    static reset(): void;
}
declare class SubqueryAliasGenerator {
    private static counter;
    static generate(): string;
    static reset(): void;
}

export { AliasGenerator, CompoundQueryBuilder, JoinBuilder, LimitBuilder, QueryBuilder, SelectBuilder, SubqueryAliasGenerator, WhereBuilder };
export type { Join, JoinType$1 as JoinType, Limit, OrCondition$1 as OrCondition, Query, Select, Selectable, Where, WhereCondition$1 as WhereCondition };
