type FieldAliasMapping<T extends FieldsBase, R extends FieldsBase> = {
    [K in keyof T]?: keyof R;
};
interface Select<T extends FieldsBase> extends Queryable<T> {
    select(fields: Array<FieldsWithStar<T> | Partial<Record<FieldsWithStar<T>, string | true>>>): Select<T>;
    select(fields: Partial<Record<FieldsWithStar<T>, string | true>>): Select<T>;
    select<R extends FieldsBase>(fields: FieldAliasMapping<T, R>): Select<R>;
    select<R extends FieldsBase>(fields: Array<keyof T | FieldAliasMapping<T, R>>): Select<R>;
    toString(options?: OutputOptions): string;
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

type AnyNull<T> = T extends null | undefined ? T | null | undefined : T;
type Condition<T extends FieldsBase> = {
    [K in keyof T]?: AnyNull<T[K]> | {
        $eq: AnyNull<T[K]>;
    } | {
        $gt: T[K];
    } | {
        $lt: T[K];
    } | {
        $gte: T[K];
    } | {
        $lte: T[K];
    } | {
        $ne: AnyNull<T[K]>;
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
type FieldsWithStar<T> = keyof T | "*";
type AliasedFields<TAlias extends string | undefined, U extends FieldsBase> = TAlias extends undefined ? U : {
    [K in keyof U as `${TAlias}.${K & string}`]: U[K];
};
type OutputOptions = {
    format?: "indented" | "compact";
    includeTerminator?: boolean;
};
interface Queryable<T = never> {
    toString(options?: OutputOptions): string;
}
type AnyQueryable<T extends FieldsBase> = Limit<T> | Where<T> | OrderBy<T> | Select<T> | Join<any, T> | Query<T>;
interface Query<TQuery extends FieldsBase> extends Select<TQuery>, Queryable<TQuery> {
    join<TOther extends FieldsBase, TAlias extends string>(tableName: string, tableAlias: TAlias): Join<TQuery, AliasedFields<TAlias, TOther>>;
    join<TOther extends FieldsBase, TAlias extends string>(subquery: AnyQueryable<TOther>, tableAlias: TAlias): Join<TQuery, AliasedFields<TAlias, TOther>>;
    innerJoin<TOther extends FieldsBase, TAlias extends string>(subquery: AnyQueryable<TOther>, alias: TAlias): Join<TQuery, AliasedFields<TAlias, TOther>>;
    innerJoin<TOther extends FieldsBase, TAlias extends string>(tableName: string, tableAlias: TAlias): Join<TQuery, AliasedFields<TAlias, TOther>>;
    leftJoin<TOther extends FieldsBase, TAlias extends string>(subquery: AnyQueryable<TOther>, alias: TAlias): Join<TQuery, AliasedFields<TAlias, TOther>>;
    leftJoin<TOther extends FieldsBase, TAlias extends string>(tableName: string, tableAlias: TAlias): Join<TQuery, AliasedFields<TAlias, TOther>>;
    where(conditions: WhereCondition<TQuery>): Where<TQuery>;
    orderBy(field: keyof TQuery, direction?: OrderDirection): OrderBy<TQuery>;
    limit(count: number, offset?: number): Limit<TQuery>;
}
type WhereCondition<T extends FieldsBase> = Condition<T> & {
    or?: Array<Condition<T>>;
};

declare function from<T extends FieldsBase, TAlias extends string>(tableName: string, tableAlias: TAlias): Query<AliasedFields<TAlias, T>>;
declare function from<T extends FieldsBase>(tableName: string): Query<AliasedFields<undefined, T>>;
declare function from<T extends FieldsBase, TAlias extends string>(subquery: AnyQueryable<T>, tableAlias: TAlias): Query<AliasedFields<TAlias, T>>;
declare function from<T extends FieldsBase>(subquery: AnyQueryable<T>): Query<AliasedFields<undefined, T>>;
declare const queryBuilder: {
    from: typeof from;
};

export { queryBuilder };
export type { Condition, FieldsBase, Join, JoinType, Limit, OrCondition, OrderBy, OrderDirection, Query, Select, Where, WhereCondition };
