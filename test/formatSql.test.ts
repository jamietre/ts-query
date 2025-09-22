import { describe, it, expect } from "vitest";
import { formatSql } from "../src/util/formatSql.js";

describe("formatSql", () => {
  it("should format a simple SELECT statement", () => {
    const input = "SELECT id, name FROM users WHERE age > 25;";
    const expected = `SELECT
  id,
  name
FROM users
WHERE age > 25;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should format a SELECT statement with JOINs", () => {
    const input = "SELECT u.id, u.name, p.title FROM users u INNER JOIN posts p ON u.id = p.user_id WHERE u.active = true;";
    const expected = `SELECT
  u.id,
  u.name,
  p.title
FROM users u
INNER JOIN posts p
  ON u.id = p.user_id
WHERE u.active = true;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should format a complex query with multiple conditions", () => {
    const input = "SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2000 AND g.rating > 8.0 OR g.genre = 'RPG';";
    const expected = `SELECT
  g.game_id,
  g.game_name
FROM games g
WHERE
  g.release_year > 2000
  AND g.rating > 8.0
  OR g.genre = 'RPG';`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should format LEFT JOIN statements", () => {
    const input = "SELECT u.name, p.title FROM users u LEFT JOIN posts p ON u.id = p.user_id;";
    const expected = `SELECT
  u.name,
  p.title
FROM users u
LEFT JOIN posts p
  ON u.id = p.user_id;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should format queries with LIMIT and ORDER BY", () => {
    const input = "SELECT name, age FROM users WHERE age > 18 ORDER BY age DESC LIMIT 10;";
    const expected = `SELECT
  name,
  age
FROM users
WHERE age > 18
ORDER BY age DESC
LIMIT 10;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should handle subqueries with parentheses", () => {
    const input = "SELECT u.name FROM (SELECT * FROM users WHERE active = true) u WHERE u.age > 25;";
    const expected = `SELECT u.name
FROM (
    SELECT *
FROM users
WHERE active = true
  ) u
WHERE u.age > 25;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should format UNION queries", () => {
    const input = "SELECT name FROM users WHERE active = true UNION SELECT name FROM admins WHERE role = 'super';";
    const expected = `SELECT name
FROM users
WHERE active = true
UNION
SELECT name
FROM admins
WHERE role = 'super';`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should handle multiple whitespace and normalize spacing", () => {
    const input = "SELECT    id,   name    FROM     users    WHERE  age   >   25;";
    const expected = `SELECT
  id,
  name
FROM users
WHERE age > 25;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should format CASE statements", () => {
    const input = "SELECT name, CASE WHEN age < 18 THEN 'Minor' WHEN age >= 65 THEN 'Senior' ELSE 'Adult' END as category FROM users;";
    const expected = `SELECT
  name,
  CASE
  WHEN age < 18
  THEN 'Minor'
  WHEN age >= 65
  THEN 'Senior'
  ELSE 'Adult'
END as category
FROM users;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should handle empty or whitespace-only input", () => {
    expect(formatSql("")).toBe("");
    expect(formatSql("   ")).toBe("");
    expect(formatSql("\n\t  \n")).toBe("");
  });

  it("should format INSERT statements", () => {
    const input = "INSERT INTO users (name, email, age) VALUES ('John', 'john@example.com', 30);";
    const expected = `INSERT INTO users (
    name,
  email,
  age
  ) VALUES (
    'John', 'john@example.com',
  30
  );`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should format UPDATE statements", () => {
    const input = "UPDATE users SET name = 'Jane', age = 31 WHERE id = 1;";
    const expected = `UPDATE users SET name = 'Jane',
  age = 31
WHERE id = 1;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should format DELETE statements", () => {
    const input = "DELETE FROM users WHERE age < 18 AND active = false;";
    const expected = `DELETE
FROM users
WHERE
  age < 18
  AND active = false;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should preserve case sensitivity in values while formatting keywords", () => {
    const input = "select Name, Email from Users where Status = 'Active';";
    const expected = `SELECT
  Name,
  Email
FROM Users
WHERE Status = 'Active';`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should handle complex nested queries", () => {
    const input = "SELECT u.name FROM users u WHERE u.id IN (SELECT user_id FROM posts WHERE created_at > '2023-01-01') AND u.active = true;";
    const expected = `SELECT u.name
FROM users u
WHERE u.id IN (
    SELECT user_id
FROM posts
WHERE
  created_at > '2023-01-01'
  )
  AND u.active = true;`;

    expect(formatSql(input)).toBe(expected);
  });

  it("should support custom indent size", () => {
    const input = "SELECT name FROM users WHERE age > 18 AND active = true;";
    const expected = `SELECT name
FROM users
WHERE
    age > 18
    AND active = true;`;

    expect(formatSql(input, { indentSize: 4 })).toBe(expected);
  });

  it("should handle single vs multi-clause WHERE correctly", () => {
    // Single clause - stays on same line
    const singleInput = "SELECT name FROM users WHERE age > 25;";
    const singleExpected = `SELECT name
FROM users
WHERE age > 25;`;

    // Multi-clause - keyword on separate line
    const multiInput = "SELECT name FROM users WHERE age > 18 AND active = true;";
    const multiExpected = `SELECT name
FROM users
WHERE
  age > 18
  AND active = true;`;

    expect(formatSql(singleInput)).toBe(singleExpected);
    expect(formatSql(multiInput)).toBe(multiExpected);
  });

  it("should handle single vs multi-field SELECT correctly", () => {
    // Single field - stays on same line
    const singleInput = "SELECT name FROM users;";
    const singleExpected = `SELECT name
FROM users;`;

    // Multi-field - keyword on separate line
    const multiInput = "SELECT id, name, email FROM users;";
    const multiExpected = `SELECT
  id,
  name,
  email
FROM users;`;

    expect(formatSql(singleInput)).toBe(singleExpected);
    expect(formatSql(multiInput)).toBe(multiExpected);
  });
});