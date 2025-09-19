interface Query<T extends object> {
  select(fields: Array<keyof T>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(fields: Array<keyof T> | Partial<Record<keyof T, string>>): Select<T>;

  leftJoin<U extends object>(tableName: string, tableAlias: string): Join<T, U>;
}

export class BaseQuery<T extends object> implements Query<T> {
  readonly tableName: string;
  readonly tableAlias: string;
  static from<T extends object>(tableName: string, tableAlias: string) {
    return new BaseQuery<T>(tableName, tableAlias);
  }
  constructor(tableName: string, tableAlias: string) {
    this.tableName = tableName;
    this.tableAlias = tableAlias;
  }
  select(fields: Array<keyof T>): Select<T>;
  select(fields: Partial<Record<keyof T, string>>): Select<T>;
  select(fields: Array<keyof T> | Partial<Record<keyof T, string>>): Select<T> {
    return new Select<T>(this, fields);
  }

  leftJoin<U extends object>(tableName: string, tableAlias: string): Join<T, U> {
    const newQuery = new BaseQuery<U>(tableName, tableAlias);
    return new Join<T, U>(this, newQuery);
  }
}

export class CompoundQuery<T extends object, U extends object> implements Query<T & U> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  readonly join: Join<T, U>;
  constructor(query1: Query<Partial<T>>, query2: Query<Partial<U>>, join: Join<T, U>) {
    this.query1 = query1;
    this.query2 = query2;
    this.join = join;
  }
  select(fields: Array<keyof T & U>): Select<T & U>;
  select(fields: Partial<Record<keyof T | keyof U, string>>): Select<T & U>;
  select(fields: Array<keyof T | keyof U> | Partial<Record<keyof T | keyof U, string>>): Select<T & U> {
    return new Select<T & U>(this as Query<T & U>, fields);
  }
  leftJoin<V extends object>(tableName: string, tableAlias: string): Join<T & U, V> {
    const newQuery = new BaseQuery<V>(tableName, tableAlias);
    return new Join<T & U, V>(this, newQuery);
  }
}

export class Join<T extends object, U extends object> {
  readonly query1: Query<T>;
  readonly query2: Query<U>;
  condition?: Partial<Record<keyof T, keyof U>>;
  constructor(query1: Query<T>, query2: Query<U>) {
    this.query1 = query1;
    this.query2 = query2;
  }
  on(condition: Partial<Record<keyof T, keyof U>>): Query<T & U> {
    this.condition = condition;
    return new CompoundQuery<T, U>(this.query1, this.query2, this);
  }
}

export class Select<T extends object> {
  query: Query<T>;
  fields: Partial<Record<keyof T, string>> = {};
  constructor(query: Query<T>, fields: Array<keyof T> | Partial<Record<keyof T, string>>) {
    this.query = query;
    if (Array.isArray(fields)) {
      fields.forEach((field) => {
        this.fields[field] = field as string;
      });
      return;
    }
    Object.entries(fields).forEach(([key, value]) => {
      this.fields[key as keyof T] = value as string;
    });
    return;
  }
  private getSource(query: Query<any>): string {
    if (query instanceof BaseQuery) {
      return `${query.tableName} AS ${query.tableAlias}`;
    } else if (query instanceof CompoundQuery) {
      const left = this.getSource(query.query1);
      const right = this.getSource(query.query2);
      const on = Object.entries(query.join.condition || {})
        .map(([key, value]) => {
          const q1 = query.query1 as BaseQuery<any>;
          const q2 = query.query2 as BaseQuery<any>;
          return `${q1.tableAlias}.${String(key)} = ${q2.tableAlias}.${String(value)}`;
        })
        .join(" AND ");
      return `${left} LEFT JOIN ${right} ON ${on}`;
    }
    return "";
  }

  toString() {
    const fields = Object.entries(this.fields)
      .map(([column, alias]) => {
        if (column === alias) {
          return column;
        }
        return `${column} AS ${alias}`;
      })
      .join(", ");
    const source = this.getSource(this.query);
    return `SELECT ${fields} FROM ${source}`;
  }
}

type TableFields = {
  game_id: number;
  game_name: string;
  release_year: number;
};

type TableFields2 = {
  game_id: number;
  description: string;
};
const query = BaseQuery.from<TableFields>("games", "g")
  .leftJoin<TableFields2>("developers", "d")
  .on({ game_id: "game_id" })
  .select({
    game_id: "id",
  });