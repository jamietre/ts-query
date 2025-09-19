import { describe, it, expect } from "vitest";
import { queryBuilder } from "../src/index.js";
import { TableFields, TableFields2 } from "./test-types.js";

describe("Subquery functionality", () => {
  it("should handle simple subquery with alias", () => {
    const subquery = queryBuilder.from<TableFields>("games", "g").where({ release_year: { $gt: 2000 } });
    const query2 = queryBuilder.from(subquery, "recent_games_count");

    const query = queryBuilder
      .from(subquery, "recent_games_count")
      .where({ game_id: 1 })
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT game_id, game_name FROM (SELECT * FROM games AS g WHERE g.release_year > 2000) AS recent_games_count WHERE recent_games_count.game_id = 1",
    );
  });

  it("should handle subquery with join in main query", () => {
    const subquery = queryBuilder.from<TableFields>("recent_games", "rg").where({ release_year: { $gt: 2020 } });

    const query = queryBuilder
      .from<TableFields>("games", "g")
      .leftJoin(subquery, "recent_count")
      .on({ game_id: "game_id" })
      .where({ game_id: 1 })
      .select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id, g.game_name FROM games AS g LEFT JOIN (SELECT * FROM recent_games AS rg WHERE rg.release_year > 2020) AS t1 ON g.game_id = t1.game_id WHERE g.game_id = 1",
    );
  });

  it("should handle subquery with complex conditions", () => {
    const subquery = queryBuilder.from<TableFields>("games", "g").where({
      release_year: { $gt: 2000 },
      or: [{ game_name: { $like: "%Mario%" } }],
    });

    const query = queryBuilder.from(subquery, "mario_or_recent").select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT game_id, game_name FROM (SELECT * FROM games AS g WHERE (g.release_year > 2000) OR (g.game_name LIKE '%Mario%')) AS mario_or_recent",
    );
  });

  it("should handle subquery with joins inside subquery", () => {
    const subquery = queryBuilder
      .from<TableFields>("games", "g")
      .innerJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .where({ game_id: 1 });

    const query = queryBuilder.from(subquery, "game_with_dev").select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT game_id, game_name FROM (SELECT * FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id WHERE g.game_id = 1) AS game_with_dev",
    );
  });

  it("should handle multiple subqueries used as FROM sources", () => {
    const subquery1 = queryBuilder.from<TableFields>("games", "g").where({ release_year: { $gt: 2020 } });

    const subquery2 = queryBuilder
      .from<TableFields>("games", "g")
      .where({ release_year: { $lt: 1990 } })
      .orderBy("release_year", "DESC");

    const query1 = queryBuilder.from(subquery1, "recent_games").select(["game_id", "game_name"]);

    const query2 = queryBuilder.from(subquery2, "old_games").select(["game_id", "game_name"]);

    const sql1 = query1.toString();
    const sql2 = query2.toString();

    expect(sql1).toBe(
      "SELECT game_id, game_name FROM (SELECT * FROM games AS g WHERE g.release_year > 2020) AS recent_games",
    );
    expect(sql2).toBe(
      "SELECT game_id, game_name FROM (SELECT * FROM games AS g WHERE g.release_year < 1990 ORDER BY g.release_year DESC) AS old_games",
    );
  });

  it("should handle subquery with OR conditions using chained method", () => {
    const subquery = queryBuilder
      .from<TableFields>("games", "g")
      .where({ release_year: { $gt: 2020 } })
      .or({ game_name: { $like: "%Classic%" } });

    const query = queryBuilder.from(subquery, "filtered_games").select({
      game_id: "id",
      game_name: "name",
    });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT id AS game_id, name AS game_name FROM (SELECT * FROM games AS g WHERE (g.release_year > 2020) OR (g.game_name LIKE '%Classic%')) AS filtered_games",
    );
  });
});
