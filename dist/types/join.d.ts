import { Query } from "./query.js";
export type JoinType = 'INNER' | 'LEFT';
export declare class Join<T extends object, U extends object> {
    readonly query1: Query<T>;
    readonly query2: Query<U>;
    readonly joinType: JoinType;
    condition?: Partial<Record<keyof T, keyof U>>;
    constructor(query1: Query<T>, query2: Query<U>, joinType?: JoinType);
    on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U>;
}
//# sourceMappingURL=join.d.ts.map