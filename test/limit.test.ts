import { describe, it, expect } from "vitest";
import { queryBuilder } from "../src/index.js";
import { TableFields, TableFields2 } from "./test-types.js";

describe("LIMIT functionality", () => {
  it("should generate simple LIMIT clause", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gt: 2000 } })
      .limit(10)
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2000 LIMIT 10");
  });

  it("should generate LIMIT with OFFSET clause", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gt: 2000 } })
      .limit(10, 20)
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2000 LIMIT 10 OFFSET 20");
  });

  it("should generate LIMIT with chained OFFSET", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gt: 2000 } })
      .limit(10)
      .offset(20)
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2000 LIMIT 10 OFFSET 20");
  });

  it("should work with complex WHERE conditions", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({
        "g.release_year": { $gt: 2000 },
        or: [{ "g.game_name": { $like: "%Mario%" } }],
      })
      .limit(5)
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id, g.game_name FROM games g WHERE (g.release_year > 2000) OR (g.game_name LIKE '%Mario%') LIMIT 5",
    );
  });

  it("should work with JOINs", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .leftJoin<TableFields2, "d">("developers", "d")
      .on({ "g.game_id": "d.game_id" })
      .where({ "g.game_id": { $lt: 100 } })
      .limit(10)
      .select({
        "g.game_id": "id",
        "g.game_name": "name",
        "d.description": "desc",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id AS id, g.game_name AS name, d.description AS desc FROM games g LEFT JOIN developers d ON g.game_id = d.game_id WHERE g.game_id < 100 LIMIT 10",
    );
  });

  it("should work with OR conditions", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gt: 2020 } })
      .or({ "g.game_name": { $like: "%Classic%" } })
      .limit(3)
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id, g.game_name FROM games g WHERE (g.release_year > 2020) OR (g.game_name LIKE '%Classic%') LIMIT 3",
    );
  });

  it("should work with chained WHERE conditions", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gt: 2000 } })
      .where({ "g.game_name": { $like: "%Action%" } })
      .limit(8)
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2000 AND g.game_name LIKE '%Action%' LIMIT 8",
    );
  });

  it("should work with field aliases", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gte: 2010 } })
      .limit(15)
      .select({
        "g.game_id": "id",
        "g.game_name": "title",
        "g.release_year": "year",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id AS id, g.game_name AS title, g.release_year AS year FROM games g WHERE g.release_year >= 2010 LIMIT 15",
    );
  });

  it("should work with mixed array field selection", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_id": { $in: [1, 2, 3, 4, 5] } })
      .limit(3)
      .select(["g.game_id", { "g.game_name": "title" }, "g.release_year"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id, g.game_name AS title, g.release_year FROM games g WHERE g.game_id IN (1, 2, 3, 4, 5) LIMIT 3",
    );
  });

  it("should handle LIMIT without WHERE clause", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({}) // Empty where to enable limit chaining
      .limit(5)
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g LIMIT 5");
  });

  it("should work with LIMIT only (no OFFSET)", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_name": "Tetris" })
      .limit(1)
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_name = 'Tetris' LIMIT 1");
  });

  it("should override OFFSET when chained", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gt: 2000 } })
      .limit(10, 5) // Initial offset of 5
      .offset(15) // Override with offset of 15
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2000 LIMIT 10 OFFSET 15");
  });
});
