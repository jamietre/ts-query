import { describe, it, expect } from "vitest";
import { queryBuilder, Query } from "../src/index.js";
import { TableFields, TableFields2, PublisherFields, ComplexJoinFields, PlatformFields } from "./test-types.js";

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
      "SELECT id AS game_id, name AS game_name, desc AS description FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id",
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
      "SELECT id AS game_id, name AS game_name, desc AS description FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id",
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
    expect(sql).toBe("SELECT id AS game_id FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id");
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
      "SELECT id AS game_id, name AS game_name, desc AS description, publisher AS publisher_name FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id INNER JOIN publishers AS p ON d.game_id = p.game_id",
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
      "SELECT id AS game_id, name AS game_name, desc AS description, publisher AS publisher_name FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id LEFT JOIN publishers AS p ON d.game_id = p.game_id",
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
      "SELECT id AS game_id, name AS game_name, desc AS description FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id WHERE d.game_id = 1",
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
      "SELECT id AS game_id, name AS game_name, desc AS description FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id WHERE (d.game_id = 1) OR (d.description LIKE '%indie%')",
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
    expect(sql1).toBe("SELECT game_id, game_name FROM games AS g INNER JOIN developers AS d ON g.game_id = d.game_id");
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
      "SELECT id AS game_id, name AS game_name, desc AS description FROM games AS g LEFT JOIN game_developers AS gd ON g.game_id = gd.game_id",
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
      "SELECT id AS game_id, name AS game_name, platform AS platform_name FROM games AS g LEFT JOIN developers AS d ON g.game_id = d.game_id LEFT JOIN publishers AS p ON d.game_id = p.game_id LEFT JOIN platforms AS pl ON p.game_id = pl.game_id",
    );
  });
});
