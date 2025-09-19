import { queryBuilder } from "./src/index";
import { TableFields } from "./test/test-types";

// Let's debug what types we're actually getting
const subquery1 = queryBuilder.from<TableFields>("games", "g").where({ release_year: { $gt: 2020 } });

// Check the type of subquery1
type SubqueryType = typeof subquery1;

// Check what our ExtractQueryableType does with it
import type { Queryable } from "./src/types/query";

type ExtractQueryableType<Q> = Q extends Queryable<infer T> ? T : never;
type ExtractedType = ExtractQueryableType<SubqueryType>;

// Let's also check if subquery1 is assignable to Queryable<TableFields>
const test: Queryable<TableFields> = subquery1;

// And let's see what from2 infers
const query1 = queryBuilder.from2(subquery1);
type Query1Type = typeof query1;

export type DebugTypes = {
  SubqueryType: SubqueryType;
  ExtractedType: ExtractedType;
  Query1Type: Query1Type;
};