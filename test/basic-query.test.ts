import { describe, it, expect } from "vitest";
import { queryBuilder, Query } from "../src/index.js";
import { TableFields, TableFields2, PublisherFields } from "./test-types.js";

describe("Basic Query Functionality", () => {
  it("should create a basic query with from method", () => {
    const query = queryBuilder.from<TableFields>("games", "g");

    expect(query.toString()).toBe("SELECT * FROM games AS g");
  });

  it("should generate SQL for simple select with array of fields", () => {
    const query = queryBuilder.from<TableFields>("games", "g").select(["game_id", "game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, game_name FROM games AS g");
  });

  it("should generate SQL for simple select with field mapping", () => {
    const query = queryBuilder.from<TableFields>("games", "g").select({
      game_id: "id",
      game_name: "name",
    });

    const sql = query.toString();
    expect(sql).toBe("SELECT id AS game_id, name AS game_name FROM games AS g");
  });

  it("should handle select with same field name and alias", () => {
    const query = queryBuilder.from<TableFields>("games", "g").select({
      game_id: "game_id", // Same name as alias
      game_name: "title", // Different alias
    });

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, title AS game_name FROM games AS g");
  });

  it("should handle mixed array with strings and objects", () => {
    const query = queryBuilder.from<TableFields>("games", "g").select([
      "game_id", // string field name
      { game_name: "title" }, // object with alias
      "release_year", // another string field name
    ]);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, title AS game_name, release_year FROM games AS g");
  });

  it("should handle array with only objects", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .select([{ game_id: "id" }, { game_name: "name" }, { release_year: "year" }]);

    const sql = query.toString();
    expect(sql).toBe("SELECT id AS game_id, name AS game_name, year AS release_year FROM games AS g");
  });

  it("should handle mixed array with multiple fields in objects", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .select(["game_id", { game_name: "title", release_year: "year" }]);

    const sql = query.toString();
    expect(sql).toBe("SELECT game_id, title AS game_name, year AS release_year FROM games AS g");
  });

  it("should handle multiple joins in sequence", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .leftJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .leftJoin<PublisherFields>("publishers", "p")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
        game_name: "name",
        description: "desc",
        publisher_name: "publisher",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT id AS game_id, name AS game_name, desc AS description, publisher AS publisher_name FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id LEFT JOIN publishers AS p ON d.game_id = p.game_id",
    );
  });

  it("should match the example usage from the prompt", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .leftJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
      });

    const sql = query.toString();
    expect(sql).toBe("SELECT id AS game_id FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id");
  });
});
