import { Query } from "./query.js";
export declare class Select<T extends object> {
    query: Query<T>;
    fields: Partial<Record<keyof T, string>>;
    subquery?: Query<any>;
    subqueryAlias?: string;
    constructor(query: Query<T>, fields: any, alias?: string);
    private getSource;
    private getRightmostTableAlias;
    private formatCondition;
    private getWhereClause;
    private getTableAliasForField;
    private formatValue;
    private generateSubquerySQL;
    toString(): string;
}
//# sourceMappingURL=select.d.ts.map