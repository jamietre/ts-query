import { QueryBuilder } from "./query.js";
import { JoinBuilder } from "./join.js";
import { SelectBuilder } from "./select.js";
import { WhereBuilder } from "./where.js";
import { OrderByBuilder } from "./orderBy.js";
import { AliasGenerator } from "./aliasGenerator.js";
import type { Query, WhereCondition, Queryable } from "./types/query.js";
import type { Join } from "./types/join.js";
import type { Select } from "./types/select.js";
import type { Where } from "./types/where.js";
import type { OrderBy, OrderDirection } from "./types/orderBy.js";

export class CompoundQueryBuilder<T extends object, U extends object> implements Query<T & U> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  readonly joinInfo: JoinBuilder<T, U>;
  constructor(query1: Query<T>, query2: Query<U>, join: JoinBuilder<T, U>) {
    this.query1 = query1;
    this.query2 = query2;
    this.joinInfo = join;
  }
  select(fields: Array<keyof T & U>): Select<T & U>;
  select(fields: Partial<Record<keyof T | keyof U, string>>): Select<T & U>;
  select(fields: Array<keyof T | keyof U> | Partial<Record<keyof T | keyof U, string>>): Select<T & U> {
    return new SelectBuilder<T & U>(this as Query<T & U>, fields);
  }
  join<V extends object>(entity: string | Queryable<V>, alias?: string): Join<T & U, V> {
    if (typeof entity === 'string') {
      const newQuery = new QueryBuilder<V>(entity, alias || AliasGenerator.generate());
      return new JoinBuilder<T & U, V>(this, newQuery, 'INNER');
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<V>(`(${entity.toString()})`, alias || AliasGenerator.generate());
      return new JoinBuilder<T & U, V>(this, newQuery, 'INNER');
    }
  }

  innerJoin<V extends object>(entity: string | Queryable<V>, alias?: string): Join<T & U, V> {
    return this.join<V>(entity, alias);
  }

  leftJoin<V extends object>(entity: string | Queryable<V>, alias?: string): Join<T & U, V> {
    if (typeof entity === 'string') {
      const newQuery = new QueryBuilder<V>(entity, alias || AliasGenerator.generate());
      return new JoinBuilder<T & U, V>(this, newQuery, 'LEFT');
    } else {
      // Handle subquery case - create a QueryBuilder that wraps the subquery
      const newQuery = new QueryBuilder<V>(`(${entity.toString()})`, alias || AliasGenerator.generate());
      return new JoinBuilder<T & U, V>(this, newQuery, 'LEFT');
    }
  }

  where(conditions: WhereCondition<T & U>): Where<T & U> {
    return new WhereBuilder<T & U>(this, conditions);
  }

  orderBy(field: keyof (T & U), direction: OrderDirection = 'ASC'): OrderBy<T & U> {
    return new OrderByBuilder<T & U>(this, field, direction);
  }

  toString(): string {
    return this.select(['*' as any]).toString();
  }
}
