// Example demonstrating the improved Select typing
import { queryBuilder } from './src/index.js';

// Define a sample table type
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Define the expected result type with specific aliases
interface UserSummary {
  userId: number;
  fullName: string;
  emailAddress: string;
}

// Example usage with the improved typing
const query = queryBuilder.from<User>('users')
  .select<UserSummary>([
    { id: 'userId' },        // id field aliased to 'userId' (must be keyof UserSummary)
    { name: 'fullName' },    // name field aliased to 'fullName' (must be keyof UserSummary)
    { email: 'emailAddress' } // email field aliased to 'emailAddress' (must be keyof UserSummary)
  ]);

// The result type should now be Select<UserSummary> instead of Select<User>
// This means the query result will have the structure: { userId: number, fullName: string, emailAddress: string }

console.log('Type-safe select with aliases:', query.toString());