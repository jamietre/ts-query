// Main entry point for ts-query package
export { BaseQuery } from './query.js';
export type { Query } from './query.js';
export { Select } from './select.js';
export { Where } from './where.js';
export type { WhereCondition, OrCondition } from './where.js';
export { Join } from './join.js';
export type { JoinType } from './join.js';
export { CompoundQuery } from './compoundQuery.js';

// Type exports for advanced usage
export type {
  Query as QueryInterface
} from './query.js';