type FieldAliasMapping<T extends FieldsBase, R extends FieldsBase> = {
    [K in keyof T]?: keyof R;
};
interface Select<T extends FieldsBase> extends Queryable<T> {
    select(fields: Array<FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string>>>): Select<T>;
    select(fields: Partial<Record<FieldsWithStar<T>, string>>): Select<T>;
    select<R extends FieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
    select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;
    toString(): string;
}

type JoinType = "INNER" | "LEFT";
interface Join<T extends FieldsBase, U extends FieldsBase> {
    on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}

interface Limit<T extends FieldsBase> extends Select<T> {
    offset(offsetValue: number): Select<T>;
}

type OrderDirection = "ASC" | "DESC";
interface OrderBy<T extends FieldsBase> extends Select<T> {
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
    limit(count: number, offset?: number): Limit<T>;
}

type Condition<T extends FieldsBase> = {
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
type OrCondition<T extends FieldsBase> = {
    type: "or";
    conditions: Condition<T>;
};
interface Where<T extends FieldsBase> extends Query<T>, Queryable<T> {
    where(conditions: WhereCondition<T>): Where<T>;
    or(conditions: Condition<T>): Where<T>;
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
    /**
     * Add a limit clause.
     */
    limit(count: number, offset?: number): Limit<T>;
}

type FieldsBase = {};
type FieldsWithStar<T extends FieldsBase> = keyof T | "*";
interface Queryable<T extends FieldsBase> {
    toString(): string;
}
type AnyQueryable<T extends FieldsBase> = Limit<T> | Where<T> | OrderBy<T> | Select<T> | Join<any, T> | Query<T>;
interface Query<T extends FieldsBase> extends Select<T>, Queryable<T> {
    join<U extends FieldsBase>(tableName: string, tableAlias?: string): Join<T, U>;
    innerJoin<U extends FieldsBase>(tableName: string, tableAlias?: string): Join<T, U>;
    leftJoin<U extends FieldsBase>(tableName: string, tableAlias?: string): Join<T, U>;
    join<U extends FieldsBase>(subquery: AnyQueryable<U>, alias?: string): Join<T, U>;
    innerJoin<U extends FieldsBase>(subquery: AnyQueryable<U>, alias?: string): Join<T, U>;
    leftJoin<U extends FieldsBase>(subquery: AnyQueryable<U>, alias?: string): Join<T, U>;
    where(conditions: WhereCondition<T>): Where<T>;
    orderBy(field: keyof T, direction?: OrderDirection): OrderBy<T>;
    limit(count: number, offset?: number): Limit<T>;
}
type WhereCondition<T extends FieldsBase> = Condition<T> & {
    or?: Array<Condition<T>>;
};

declare function from<T extends FieldsBase>(tableName: string, tableAlias?: string): Query<T>;
declare function from<T extends FieldsBase>(subquery: AnyQueryable<T>, tableAlias?: string): Query<T>;
declare const queryBuilder: {
    from: typeof from;
};

export { queryBuilder };
export type { Condition, Join, JoinType, Limit, OrCondition, OrderBy, OrderDirection, Query, Select, FieldsBase as TableFieldsBase, Where, WhereCondition };
