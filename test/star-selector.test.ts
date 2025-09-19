import { describe, it, expect } from "vitest";
import { queryBuilder, TableFieldsBase } from "../src/index.js";

// Test type that extends TableFieldsBase
type TestTable = {
  id: number;
  name: string;
} & TableFieldsBase;

describe("Star selector functionality", () => {
  it("should support selecting all fields with '*'", () => {
    const query = queryBuilder.from<TestTable>("test", "t").select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test");
  });

  it("should support selecting specific fields", () => {
    const query = queryBuilder.from<TestTable>("test", "t").select(["id", "name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT id, name FROM test");
  });

  it("should support mixing '*' with specific fields", () => {
    const query = queryBuilder.from<TestTable>("test", "t").select(["*", "id"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT *, id FROM test");
  });

  it("should support '*' in queries with WHERE clauses", () => {
    const query = queryBuilder.from<TestTable>("test", "t").where({ id: 1 }).select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test WHERE t.id = 1");
  });

  it("should support '*' in queries with JOIN clauses", () => {
    const query = queryBuilder
      .from<TestTable>("test", "t")
      .join<TestTable>("other", "o")
      .on({ id: "id" })
      .select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test AS t INNER JOIN other AS o ON t.id = o.id");
  });

  it("should support '*' with LIMIT", () => {
    const query = queryBuilder.from<TestTable>("test", "t").limit(10).select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test LIMIT 10");
  });

  it("should support '*' with ORDER BY", () => {
    const query = queryBuilder.from<TestTable>("test", "t").orderBy("name", "ASC").select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test ORDER BY t.name ASC");
  });
});
