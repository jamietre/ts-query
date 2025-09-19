import { describe, it, expect } from "vitest";
import { queryBuilder, Query } from "../src/index.js";
import {
  TableFields,
  TableFields2,
  PublisherFields,
  ComplexJoinFields,
  PlatformFields,
  GameFields,
  DeveloperFields,
} from "./test-types.js";

describe("JOIN functionality", () => {
  it("should generate INNER JOIN with join method", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .join<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
        game_name: "name",
        description: "desc",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.id AS game_id, g.name AS game_name, g.desc AS description FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id",
    );
  });

  it("should generate INNER JOIN with innerJoin method", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .innerJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
        game_name: "name",
        description: "desc",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.id AS game_id, g.name AS game_name, g.desc AS description FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id",
    );
  });

  it("should generate SQL for left join with on condition", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .leftJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
      });

    const sql = query.toString();
    expect(sql).toBe("SELECT g.id AS game_id FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id");
  });

  it("should handle multiple INNER JOINs", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .join<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .innerJoin<PublisherFields>("publishers", "p")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
        game_name: "name",
        description: "desc",
        publisher_name: "publisher",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.id AS game_id, g.name AS game_name, g.desc AS description, g.publisher AS publisher_name FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id INNER JOIN publishers AS p ON d.game_id = p.game_id",
    );
  });

  it("should handle mixed join types", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .join<TableFields2>("developers", "d")
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
      "SELECT g.id AS game_id, g.name AS game_name, g.desc AS description, g.publisher AS publisher_name FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id LEFT JOIN publishers AS p ON d.game_id = p.game_id",
    );
  });

  it("should work with INNER JOIN and WHERE clauses", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .innerJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .where({ game_id: 1 })
      .select({
        game_id: "id",
        game_name: "name",
        description: "desc",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.id AS game_id, g.name AS game_name, g.desc AS description FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id WHERE g.game_id = 1",
    );
  });

  it("should work with INNER JOIN and OR conditions", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .join<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .where({ game_id: 1 })
      .or({ description: { $like: "%indie%" } })
      .select({
        game_id: "id",
        game_name: "name",
        description: "desc",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.id AS game_id, g.name AS game_name, g.desc AS description FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id WHERE (g.game_id = 1) OR (g.description LIKE '%indie%')",
    );
  });

  it("should verify that join and innerJoin produce identical results", () => {
    const query1 = queryBuilder
      .from<TableFields>("games", "g")
      .join<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .select(["game_id", "game_name"]);

    const query2 = queryBuilder
      .from<TableFields>("games", "g")
      .innerJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .select(["game_id", "game_name"]);

    const sql1 = query1.toString();
    const sql2 = query2.toString();

    expect(sql1).toBe(sql2);
    expect(sql1).toBe(
      "SELECT g.game_id, g.game_name FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id",
    );
  });

  it("should handle multiple join conditions", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .leftJoin<ComplexJoinFields>("game_developers", "gd")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
        game_name: "name",
        description: "desc",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.id AS game_id, g.name AS game_name, g.desc AS description FROM games AS g LEFT JOIN game_developers AS gd ON g.game_id = gd.game_id",
    );
  });

  it("should handle triple joins correctly", () => {
    const query = queryBuilder
      .from<TableFields>("games", "g")
      .leftJoin<TableFields2>("developers", "d")
      .on({ game_id: "game_id" })
      .leftJoin<PublisherFields>("publishers", "p")
      .on({ game_id: "game_id" })
      .leftJoin<PlatformFields>("platforms", "pl")
      .on({ game_id: "game_id" })
      .select({
        game_id: "id",
        game_name: "name",
        platform_name: "platform",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.id AS game_id, g.name AS game_name, g.platform AS platform_name FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id LEFT JOIN publishers AS p ON d.game_id = p.game_id LEFT JOIN platforms AS pl ON p.game_id = pl.game_id",
    );
  });

  describe("conflicting field names with aliases", () => {
    type TableFields = {
      game_id: number;
      game_name: string;
      description: string;
    };

    it("should handle select with same field name and alias", () => {
      const query = queryBuilder
        .from<TableFields>("games")
        .join<TableFields>("games2")
        .on({ game_id: "game_id" })
        .select({
          game_id: "game_id", // Same name as alias
          game_name: "game_name", // Different alias
        });

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT t1.game_id, t1.game_name FROM games AS t1 INNER JOIN games2 AS t2 ON t1.game_id = t2.game_id",
      );
    });
  });

  describe("join with field selection", () => {
    it("should support traditional join without field selection", () => {
      const query = queryBuilder
        .from<GameFields>("games", "g")
        .join<DeveloperFields>("developers", "d")
        .on({ id: "id" })
        .select({
          // Use only valid field names from the combined GameFields & DeveloperFields type
          name: "name", // name exists in both types
          id: "id", // id exists in both types
          founded_year: "founded_year", // founded_year exists in DeveloperFields
          release_year: "release_year", // release_year exists in GameFields
        });

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.name, g.id, g.founded_year, g.release_year FROM games AS g INNER JOIN developers AS d ON g.id = d.id",
      );
    });

    it("should support join.select().on() pattern - basic functionality", () => {
      // Test that the join.select().on() pattern works syntactically
      const query = queryBuilder
        .from<GameFields>("games", "g")
        .join<DeveloperFields>("developers", "d")
        .alias({
          developer_name: "name",
          founded_year_2: "founded_year",
        }) // Select specific fields from developers
        .on({ id: "id" })
        .select([
          "name", // This should work - field exists in both types
          "founded_year_2", // This should work - field exists in developer type
          "release_year", // This should work - field exists in game type
        ]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.name, d.founded_year AS founded_year_2, g.release_year FROM games AS g INNER JOIN developers AS d ON g.id = d.id",
      );
    });

    it("should allow chaining join.select() for type safety", () => {
      // This demonstrates that join.select() is chainable and returns something that has .on()
      const joinWithFields = queryBuilder
        .from<GameFields>("games", "g")
        .join<DeveloperFields>("developers", "d")
        .alias(["name"]); // This should return JoinWithFields

      // Now we should be able to call .on() on the result
      const query = joinWithFields.on({ id: "id" }).select(["name", "release_year"]);

      const sql = query.toString();
      expect(sql).toBe("SELECT g.name, g.release_year FROM games AS g INNER JOIN developers AS d ON g.id = d.id");
    });

    it("should support both join patterns", () => {
      // Traditional pattern should still work
      const traditionalQuery = queryBuilder
        .from<GameFields>("games", "g")
        .join<DeveloperFields>("developers", "d")
        .on({ id: "id" })
        .select(["name"]);

      // New pattern should also work
      const newPatternQuery = queryBuilder
        .from<GameFields>("games", "g")
        .join<DeveloperFields>("developers", "d")
        .alias(["name"])
        .on({ id: "id" })
        .select(["name"]);

      const sql1 = traditionalQuery.toString();
      const sql2 = newPatternQuery.toString();

      // Both should produce similar SQL (the functionality is the same for now)
      expect(sql1).toBe("SELECT g.name FROM games AS g INNER JOIN developers AS d ON g.id = d.id");
      expect(sql2).toBe("SELECT g.name FROM games AS g INNER JOIN developers AS d ON g.id = d.id");
    });

    it("should support type-safe field mapping with FieldMap", () => {
      // Test the new FieldMap<U> functionality that allows mapping fields from the joined table (U)
      const query = queryBuilder
        .from<GameFields>("games", "g")
        .join<DeveloperFields>("developers", "d")
        .alias({
          // These are type-safe mappings: keys can be any string, values must be valid fields from DeveloperFields (U)
          dev_name: "name", // Maps DeveloperFields.name to "dev_name"
          founded: "founded_year", // Maps DeveloperFields.founded_year to "founded"
          created_date: "created_at", // Maps DeveloperFields.created_at to "created_date"
        })
        .on({ id: "id" })
        .select(["name", "release_year", "created_at", "created_date"]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.name, g.release_year, g.created_at, d.created_at AS created_date FROM games AS g INNER JOIN developers AS d ON g.id = d.id",
      );
    });
  });
});
