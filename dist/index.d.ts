type FieldAliasMapping<T extends QueryFieldsBase, R extends QueryFieldsBase> = {
    [K in keyof T]?: keyof R;
};
interface Select<T extends QueryFieldsBase> extends Queryable<T> {
    select(fields: Array<keyof T | Partial<Record<keyof T, string>>>): Select<T>;
    select(fields: Partial<Record<keyof T, string>>): Select<T>;
    select<R extends QueryFieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
    select<R extends QueryFieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;
    toString(): string;
}

type JoinType = 'INNER' | 'LEFT';
interface Join<T extends QueryFieldsBase, U extends QueryFieldsBase> {
    on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}

interface Limit<T extends QueryFieldsBase> extends Select<T> {
    offset(offsetValue: number): Select<T>;
}

type OrderDirection = 'ASC' | 'DESC';
interface OrderBy<T extends QueryFieldsBase> extends Select<T> {
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
    limit(count: number, offset?: number): Limit<T>;
}

type Condition<T extends QueryFieldsBase> = {
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
type OrCondition<T extends QueryFieldsBase> = {
    type: "or";
    conditions: Condition<T>;
};
interface Where<T extends QueryFieldsBase> extends Query<T>, Queryable<T> {
    where(conditions: WhereCondition<T>): Where<T>;
    or(conditions: Condition<T>): Where<T>;
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
    /**
     * Add a limit clause.
     */
    limit(count: number, offset?: number): Limit<T>;
}

type QueryFieldsBase = {
    "*": string;
};
interface Queryable<T extends QueryFieldsBase> {
    toString(): string;
}
type AnyQueryable<T extends QueryFieldsBase> = Limit<T> | Where<T> | OrderBy<T> | Select<T> | Join<any, T> | Query<T>;
interface Query<T extends QueryFieldsBase> extends Select<T>, Queryable<T> {
    join<U extends QueryFieldsBase>(tableName: string, tableAlias?: string): Join<T, U>;
    innerJoin<U extends QueryFieldsBase>(tableName: string, tableAlias?: string): Join<T, U>;
    leftJoin<U extends QueryFieldsBase>(tableName: string, tableAlias?: string): Join<T, U>;
    join<U extends QueryFieldsBase>(subquery: AnyQueryable<U>, alias?: string): Join<T, U>;
    innerJoin<U extends QueryFieldsBase>(subquery: AnyQueryable<U>, alias?: string): Join<T, U>;
    leftJoin<U extends QueryFieldsBase>(subquery: AnyQueryable<U>, alias?: string): Join<T, U>;
    where(conditions: WhereCondition<T>): Where<T>;
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
}
type WhereCondition<T extends QueryFieldsBase> = Condition<T> & {
    or?: Array<Condition<T>>;
};

declare function from<T extends QueryFieldsBase>(tableName: string, alias?: string): Query<T>;
declare function from<T extends QueryFieldsBase>(subquery: AnyQueryable<T>, alias2?: string): Query<T>;
declare const queryBuilder: {
    from: typeof from;
};

export { queryBuilder };
export type { Condition, Join, JoinType, Limit, OrCondition, OrderBy, OrderDirection, Query, QueryFieldsBase, Select, Where, WhereCondition };
