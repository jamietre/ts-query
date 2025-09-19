// Test the ESM build
import { BaseQuery } from './dist/esm/index.js';

console.log('Testing ESM import...');

const query = BaseQuery.from('users', 'u')
  .select(['id', 'name']);

console.log('ESM Query SQL:', query.toString());
console.log('✅ ESM import works!');