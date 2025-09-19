// Test the CommonJS build
const { BaseQuery } = require('./dist/cjs/index.js');

console.log('Testing CommonJS require...');

const query = BaseQuery.from('users', 'u')
  .select(['id', 'name']);

console.log('CJS Query SQL:', query.toString());
console.log('✅ CommonJS require works!');