import { describe, it, expect } from "vitest";
import { queryBuilder, FieldsBase } from "../src/index.js";

type TestTable = {
  id: number;
  name: string;
};

describe("Star selector functionality", () => {
  it("should support selecting all fields with '*'", () => {
    const query = queryBuilder.from<TestTable, "t">("test", "t").select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test t;");
  });

  it("should support selecting specific fields", () => {
    const query = queryBuilder.from<TestTable>("test").select(["id", "name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT id, name FROM test;");
  });

  it("should support mixing '*' with specific fields", () => {
    const query = queryBuilder.from<TestTable>("test").select(["*", "id"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT *, id FROM test;");
  });

  it("should support '*' in queries with WHERE clauses", () => {
    const query = queryBuilder.from<TestTable>("test").where({ id: 1 }).select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test WHERE id = 1;");
  });

  it("should support '*' in queries with JOIN clauses", () => {
    const query = queryBuilder
      .from<TestTable, "t">("test", "t")
      .join<TestTable, "o">("other", "o")
      .on({ "t.id": "o.id" })
      .select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test t INNER JOIN other o ON t.id = o.id;");
  });

  it("should support '*' with LIMIT", () => {
    const query = queryBuilder.from<TestTable>("test").limit(10).select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test LIMIT 10;");
  });

  it("should support '*' with ORDER BY", () => {
    const query = queryBuilder.from<TestTable>("test").orderBy("name", "ASC").select(["*"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT * FROM test ORDER BY name ASC;");
  });
});
