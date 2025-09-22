import { describe, it, expect } from "vitest";
import { queryBuilder } from "../src/index.js";
import { TableFields, TableFields2 } from "./test-types.js";

describe("Subquery functionality", () => {
  it("should handle simple subquery with alias", () => {
    const subquery = queryBuilder.from<TableFields, "g">("games", "g").where({ "g.release_year": { $gt: 2000 } });

    const query = queryBuilder
      .from(subquery, "recent_games_count")
      .where({ "recent_games_count.g.game_id": 1 })
      .select(["recent_games_count.g.game_id", "recent_games_count.g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT recent_games_count.g.game_id, recent_games_count.g.game_name FROM (SELECT * FROM games g WHERE g.release_year > 2000) AS recent_games_count WHERE recent_games_count.g.game_id = 1;",
    );
  });

  it("should handle subquery with join in main query", () => {
    const subquery = queryBuilder
      .from<TableFields, "rg">("recent_games", "rg")
      .where({ "rg.release_year": { $gt: 2020 } });

    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .leftJoin(subquery, "recent_count")
      .on({ "g.game_id": "recent_count.rg.game_id" })
      .where({ "g.game_id": 1 })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id, g.game_name FROM games g LEFT JOIN (SELECT * FROM recent_games rg WHERE rg.release_year > 2020) recent_count ON g.game_id = recent_count.rg.game_id WHERE g.game_id = 1;",
    );
  });

  it("should handle subquery with complex conditions", () => {
    const subquery = queryBuilder.from<TableFields, "g">("games", "g").where({
      "g.release_year": { $gt: 2000 },
      or: [{ "g.game_name": { $like: "%Mario%" } }],
    });

    const query = queryBuilder
      .from(subquery, "mario_or_recent")
      .select(["mario_or_recent.g.game_id", "mario_or_recent.g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT mario_or_recent.g.game_id, mario_or_recent.g.game_name FROM (SELECT * FROM games g WHERE g.release_year > 2000 OR g.game_name LIKE '%Mario%') AS mario_or_recent;",
    );
  });

  it("should handle subquery with joins inside subquery", () => {
    const subquery = queryBuilder
      .from<TableFields, "g">("games", "g")
      .innerJoin<TableFields2, "d">("developers", "d")
      .on({ "g.game_id": "d.game_id" })
      .where({ "g.game_id": 1 });

    const query = queryBuilder
      .from(subquery, "game_with_dev")
      .select(["game_with_dev.g.game_id", "game_with_dev.g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT game_with_dev.g.game_id, game_with_dev.g.game_name FROM (SELECT * FROM games g INNER JOIN developers d ON g.game_id = d.game_id WHERE g.game_id = 1) AS game_with_dev;",
    );
  });

  it("should handle multiple subqueries used as FROM sources", () => {
    const subquery1 = queryBuilder.from<TableFields, "g">("games", "g").where({ "g.release_year": { $gt: 2020 } });

    const subquery2 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $lt: 1990 } })
      .orderBy("g.release_year", "DESC");

    const query1 = queryBuilder
      .from(subquery1, "recent_games")
      .select(["recent_games.g.game_id", "recent_games.g.game_name"]);

    const query2 = queryBuilder.from(subquery2, "old_games").select(["old_games.g.game_id", "old_games.g.game_name"]);

    const sql1 = query1.toString();
    const sql2 = query2.toString();

    expect(sql1).toBe(
      "SELECT recent_games.g.game_id, recent_games.g.game_name FROM (SELECT * FROM games g WHERE g.release_year > 2020) AS recent_games;",
    );
    expect(sql2).toBe(
      "SELECT old_games.g.game_id, old_games.g.game_name FROM (SELECT * FROM games g WHERE g.release_year < 1990 ORDER BY g.release_year DESC) AS old_games;",
    );
  });

  it("should handle subquery with OR conditions using chained method", () => {
    const subquery = queryBuilder
      .from<TableFields>("games")
      .where({ release_year: { $gt: 2020 } })
      .or({ game_name: { $like: "%Classic%" } });

    const query = queryBuilder.from(subquery, "filtered_games").select({
      "filtered_games.game_id": "id",
      "filtered_games.game_name": "name",
    });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT filtered_games.game_id AS id, filtered_games.game_name AS name FROM (SELECT * FROM games WHERE release_year > 2020 OR game_name LIKE '%Classic%') AS filtered_games;",
    );
  });

  it("should handle ORDER BY with subqueries", () => {
    const subquery = queryBuilder
      .from<TableFields>("games")
      .where({ release_year: { $gt: 2000 } })
      .orderBy("release_year", "DESC");

    const query = queryBuilder
      .from(subquery, "sorted_games")
      .where({ "sorted_games.game_id": { $lt: 100 } })
      .orderBy("sorted_games.game_name", "ASC")
      .select(["sorted_games.game_id", "sorted_games.game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT sorted_games.game_id, sorted_games.game_name FROM (SELECT * FROM games WHERE release_year > 2000 ORDER BY release_year DESC) AS sorted_games WHERE sorted_games.game_id < 100 ORDER BY sorted_games.game_name ASC;",
    );
  });
});
