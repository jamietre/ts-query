function foo<T extends string, U extends Record<string, string>, V extends keyof U>(prefix: T, obj: U, key: V): 
`${T}_${V extends string ? V : never}` {
  return `${prefix}_${String(key)}` as `${T}_${V extends string ? V : never}`;
}

const example = foo("user", { id: "1", name: "Alice" }, "name");

console.log(example); // { user_id: 1, user_name: 'Alice' }import { AliasGenerator } from "./aliasGenerator.js";
import { CompoundQueryBuilder } from "./compoundQueryBuilder.js";
import { JoinWithFieldsBuilder } from "./joinWithFieldsBuilder.js";
import type { Query, FieldsBase } from "./types/query.js";
import type { Join, JoinWithFields } from "./types/join.js";

type FieldMap<T> = {
  [k: string]: keyof T | true;
};