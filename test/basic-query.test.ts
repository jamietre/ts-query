import { describe, it, expect } from "vitest";
import { queryBuilder } from "../src/index.js";
import { TableFields, TableFields2, PublisherFields } from "./test-types.js";

describe("Basic Query Functionality", () => {
  it("should create a basic query with from method", () => {
    const query = queryBuilder.from<TableFields, "g">("games", "g");

    expect(query.toString()).toBe("SELECT * FROM games g");
  });

  it("should generate SQL for simple select with array of fields", () => {
    const query = queryBuilder.from<TableFields, "g">("games", "g").select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g");
  });

  it("should generate SQL for simple select with field mapping", () => {
    const query = queryBuilder.from<TableFields, "g">("games", "g").select({
      "g.game_id": "id",
      "g.game_name": "name",
    });

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id AS id, g.game_name AS name FROM games g");
  });

  it("should handle select with same field name and alias", () => {
    const query = queryBuilder.from<TableFields, "g">("games", "g").select({
      "g.game_id": "game_id", // Same name as alias
      "g.game_name": "title", // Different alias
    });

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id AS game_id, g.game_name AS title FROM games g");
  });

  it("should handle mixed array with strings and objects", () => {
    const query = queryBuilder.from<TableFields, "g">("games", "g").select([
      "g.game_id", // string field name
      { "g.game_name": "title" }, // object with alias
      "g.release_year", // another string field name
    ]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name AS title, g.release_year FROM games g");
  });

  it("should handle array with only objects", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .select([{ "g.game_id": "id" }, { "g.game_name": "name" }, { "g.release_year": "year" }]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id AS id, g.game_name AS name, g.release_year AS year FROM games g");
  });

  it("should handle mixed array with multiple fields in objects", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .select(["g.game_id", { "g.game_name": "title", "g.release_year": "year" }]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name AS title, g.release_year AS year FROM games g");
  });

  it("should handle multiple joins in sequence", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .leftJoin<TableFields2, "d">("developers", "d")
      .on({ "g.game_id": "d.game_id" })
      .leftJoin<PublisherFields, "p">("publishers", "p")
      .on({ "d.game_id": "p.game_id" })
      .select({
        "g.game_id": "id",
        "g.game_name": "name",
        "d.description": "desc",
        "p.publisher_name": "publisher",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id AS id, g.game_name AS name, d.description AS desc, p.publisher_name AS publisher FROM games g LEFT JOIN developers d ON g.game_id = d.game_id LEFT JOIN publishers p ON d.game_id = p.game_id",
    );
  });

  it("should match the example usage from the prompt", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .leftJoin<TableFields2, "d">("developers", "d")
      .on({ "g.game_id": "d.game_id" })
      .select({
        "g.game_id": "id",
      });

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id AS id FROM games g LEFT JOIN developers d ON g.game_id = d.game_id");
  });
});
