import { describe, it, expect } from "vitest";
import { queryBuilder } from "../src/index.js";
import { TableFields, TableFields2 } from "./test-types.js";

describe("LIMIT functionality", () => {
  it("should generate simple LIMIT clause", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({ release_year: { $gt: 2000 } })
      .limit(10)
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games WHERE g.release_year > 2000 LIMIT 10");
  });

  it("should generate LIMIT with OFFSET clause", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({ release_year: { $gt: 2000 } })
      .limit(10, 20)
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games WHERE g.release_year > 2000 LIMIT 10 OFFSET 20");
  });

  it("should generate LIMIT with chained OFFSET", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({ release_year: { $gt: 2000 } })
      .limit(10)
      .offset(20)
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games WHERE g.release_year > 2000 LIMIT 10 OFFSET 20");
  });

  it("should work with complex WHERE conditions", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({
        release_year: { $gt: 2000 },
        or: [{ game_name: { $like: "%Mario%" } }],
      })
      .limit(5)
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT game_id, game_name FROM games WHERE (g.release_year > 2000) OR (g.game_name LIKE '%Mario%') LIMIT 5",
    );
  });

  it("should work with JOINs", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .leftJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .where({ game_id: { $lt: 100 } })
      .limit(10)
      .select({
        game_id: "id",
        game_name: "name",
        description: "desc",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.id AS game_id, g.name AS game_name, g.desc AS description FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id WHERE g.game_id < 100 LIMIT 10",
    );
  });

  it("should work with OR conditions", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({ release_year: { $gt: 2020 } })
      .or({ game_name: { $like: "%Classic%" } })
      .limit(3)
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT game_id, game_name FROM games WHERE (g.release_year > 2020) OR (g.game_name LIKE '%Classic%') LIMIT 3",
    );
  });

  it("should work with chained WHERE conditions", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({ release_year: { $gt: 2000 } })
      .where({ game_name: { $like: "%Action%" } })
      .limit(8)
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT game_id, game_name FROM games WHERE g.release_year > 2000 AND g.game_name LIKE '%Action%' LIMIT 8",
    );
  });

  it("should work with field aliases", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({ release_year: { $gte: 2010 } })
      .limit(15)
      .select({
        game_id: "id",
        game_name: "title",
        release_year: "year",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT id AS game_id, title AS game_name, year AS release_year FROM games WHERE g.release_year >= 2010 LIMIT 15",
    );
  });

  it("should work with mixed array field selection", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({ game_id: { $in: [1, 2, 3, 4, 5] } })
      .limit(3)
      .select(["game_id", { game_name: "title" }, "release_year"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT game_id, title AS game_name, release_year FROM games WHERE g.game_id IN (1, 2, 3, 4, 5) LIMIT 3",
    );
  });

  it("should handle LIMIT without WHERE clause", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({}) // Empty where to enable limit chaining
      .limit(5)
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games LIMIT 5");
  });

  it("should work with LIMIT only (no OFFSET)", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({ game_name: "Tetris" })
      .limit(1)
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games WHERE g.game_name = 'Tetris' LIMIT 1");
  });

  it("should override OFFSET when chained", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .where({ release_year: { $gt: 2000 } })
      .limit(10, 5) // Initial offset of 5
      .offset(15) // Override with offset of 15
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games WHERE g.release_year > 2000 LIMIT 10 OFFSET 15");
  });
});
