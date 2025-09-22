import { describe, it, expect } from "vitest";
import { queryBuilder } from "../src/index.js";
import { TableFields, TableFields2 } from "./test-types.js";

describe("WHERE functionality", () => {
  it("should generate simple where clause with equality", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_id": 1 })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1;");
  });

  it("should generate where clause with string value", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_name": "Tetris" })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_name = 'Tetris';");
  });

  it("should generate where clause with multiple conditions", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_id": 1, "g.release_year": 2020 })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1 AND g.release_year = 2020;");
  });

  it("should generate where clause with comparison operators", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gt: 2000 } })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2000;");
  });

  it("should generate where clause with IN operator", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $in: [2019, 2020, 2021] } })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.release_year IN (2019, 2020, 2021);");
  });

  it("should work with joins and where clauses", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .leftJoin<TableFields2, "d">("developers", "d")
      .on({ "g.game_id": "d.game_id" })
      .where({ "g.game_id": 1 })
      .select({
        "g.game_id": "id",
        "g.game_name": "name",
        "d.description": "desc",
      });

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id AS id, g.game_name AS name, d.description AS desc FROM games g LEFT JOIN developers d ON g.game_id = d.game_id WHERE g.game_id = 1;",
    );
  });

  it("should support chaining multiple where clauses", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gt: 2000 } })
      .where({ "g.game_name": "Tetris" })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2000 AND g.game_name = 'Tetris';");
  });

  it("should handle all comparison operators", () => {
    const query1 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $lt: 2000 } })
      .select(["g.game_name"]);
    expect(query1.toString()).toBe("SELECT g.game_name FROM games g WHERE g.release_year < 2000;");

    const query2 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $gte: 2000 } })
      .select(["g.game_name"]);
    expect(query2.toString()).toBe("SELECT g.game_name FROM games g WHERE g.release_year >= 2000;");

    const query3 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $lte: 2000 } })
      .select(["g.game_name"]);
    expect(query3.toString()).toBe("SELECT g.game_name FROM games g WHERE g.release_year <= 2000;");

    const query4 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.release_year": { $ne: 2000 } })
      .select(["g.game_name"]);
    expect(query4.toString()).toBe("SELECT g.game_name FROM games g WHERE g.release_year != 2000;");
  });

  it("should generate where clause with LIKE operator", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_name": { $like: "%Tetris%" } })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_name LIKE '%Tetris%';");
  });

  it("should handle LIKE with different patterns", () => {
    const query1 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_name": { $like: "Super%" } })
      .select(["g.game_name"]);
    expect(query1.toString()).toBe("SELECT g.game_name FROM games g WHERE g.game_name LIKE 'Super%';");

    const query2 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_name": { $like: "%Mario" } })
      .select(["g.game_name"]);
    expect(query2.toString()).toBe("SELECT g.game_name FROM games g WHERE g.game_name LIKE '%Mario';");

    const query3 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_name": { $like: "_etris" } })
      .select(["g.game_name"]);
    expect(query3.toString()).toBe("SELECT g.game_name FROM games g WHERE g.game_name LIKE '_etris';");
  });

  it("should work with LIKE and other conditions", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({
        "g.game_name": { $like: "%Mario%" },
        "g.release_year": { $gt: 1990 },
      })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe(
      "SELECT g.game_id, g.game_name FROM games g WHERE g.game_name LIKE '%Mario%' AND g.release_year > 1990;",
    );
  });

  it("should generate where clause with $eq operator", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_id": { $eq: 1 } })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1;");
  });

  it("should handle $eq with string values", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_name": { $eq: "Tetris" } })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_name = 'Tetris';");
  });

  it("should produce same result for $eq and direct value", () => {
    const query1 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_id": 1 })
      .select(["g.game_id", "g.game_name"]);

    const query2 = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.game_id": { $eq: 1 } })
      .select(["g.game_id", "g.game_name"]);

    const sql1 = query1.toString();
    const sql2 = query2.toString();

    expect(sql1).toBe(sql2);
    expect(sql1).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1;");
  });

  it("should work with $eq and other operators", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({
        "g.game_id": { $eq: 1 },
        "g.release_year": { $gt: 2000 },
      })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1 AND g.release_year > 2000;");
  });

  it("should handle null values in WHERE conditions", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.optional_field": null })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.optional_field IS NULL;");
  });

  it("should handle undefined values in WHERE conditions and map to null", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.optional_field": undefined })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.optional_field IS NULL;");
  });

  it("should handle $ne with null values for IS NOT NULL", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.optional_field": { $ne: null } })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.optional_field IS NOT NULL;");
  });

  it("should handle $eq with null values for IS NULL", () => {
    const query = queryBuilder
      .from<TableFields, "g">("games", "g")
      .where({ "g.optional_field": { $eq: null } })
      .select(["g.game_id", "g.game_name"]);

    const sql = query.toString();
    expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.optional_field IS NULL;");
  });

  describe("OR conditions", () => {
    it("should generate OR condition with simple equality", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .where({ "g.game_id": 1 })
        .or({ "g.game_id": 2 })
        .select(["g.game_id", "g.game_name"]);

      const sql = query.toString();
      expect(sql).toBe("SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1 OR g.game_id = 2;");
    });

    it("should generate OR condition with operators", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .where({ "g.release_year": { $gt: 2020 } })
        .or({ "g.game_name": { $like: "%Mario%" } })
        .select(["g.game_id", "g.game_name"]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2020 OR g.game_name LIKE '%Mario%';",
      );
    });

    it("should handle multiple OR conditions", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .where({ "g.game_id": 1 })
        .or({ "g.game_id": 2 })
        .or({ "g.game_name": "Tetris" })
        .select(["g.game_id", "g.game_name"]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1 OR g.game_id = 2 OR g.game_name = 'Tetris';",
      );
    });

    it("should handle complex OR conditions with multiple fields", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .where({ "g.game_id": 1, "g.release_year": 2020 })
        .or({ "g.game_name": "Tetris", "g.release_year": { $gt: 2019 } })
        .select(["g.game_id", "g.game_name"]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id, g.game_name FROM games g WHERE (g.game_id = 1 AND g.release_year = 2020) OR (g.game_name = 'Tetris' AND g.release_year > 2019);",
      );
    });

    it("should handle OR with joins", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .leftJoin<TableFields2, "d">("developers", "d")
        .on({ "g.game_id": "d.game_id" })
        .where({ "g.game_id": 1 })
        .or({ "d.description": { $like: "%action%" } })
        .select({
          "g.game_id": "id",
          "g.game_name": "name",
          "d.description": "desc",
        });

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id AS id, g.game_name AS name, d.description AS desc FROM games g LEFT JOIN developers d ON g.game_id = d.game_id WHERE g.game_id = 1 OR d.description LIKE '%action%';",
      );
    });

    it("should handle chained where and or conditions", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .where({ "g.release_year": { $gt: 2000 } })
        .where({ "g.game_id": { $lt: 100 } })
        .or({ "g.game_name": "Classic Game" })
        .select(["g.game_id", "g.game_name"]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id, g.game_name FROM games g WHERE (g.release_year > 2000 AND g.game_id < 100) OR g.game_name = 'Classic Game';",
      );
    });

    it("should handle inline OR syntax with simple conditions", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .where({
          "g.game_id": 1,
          or: [{ "g.game_id": 2 }, { "g.game_name": "Tetris" }],
        })
        .select(["g.game_id", "g.game_name"]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1 OR g.game_id = 2 OR g.game_name = 'Tetris';",
      );
    });

    it("should handle inline OR syntax with operators", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .where({
          "g.release_year": { $gt: 2020 },
          or: [{ "g.game_name": { $like: "%Mario%" } }, { "g.release_year": { $lt: 1990 } }],
        })
        .select(["g.game_id", "g.game_name"]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id, g.game_name FROM games g WHERE g.release_year > 2020 OR g.game_name LIKE '%Mario%' OR g.release_year < 1990;",
      );
    });

    it("should handle inline OR with multiple fields per condition", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .where({
          "g.game_id": 1,
          or: [
            { "g.game_name": "Tetris", "g.release_year": 1984 },
            { "g.game_name": "Pac-Man", "g.release_year": 1980 },
          ],
        })
        .select(["g.game_id", "g.game_name"]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1 OR (g.game_name = 'Tetris' AND g.release_year = 1984) OR (g.game_name = 'Pac-Man' AND g.release_year = 1980);",
      );
    });

    it("should combine inline OR and chained OR methods", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .where({
          "g.game_id": 1,
          or: [{ "g.game_name": "Tetris" }],
        })
        .or({ "g.release_year": { $gt: 2020 } })
        .select(["g.game_id", "g.game_name"]);

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id, g.game_name FROM games g WHERE g.game_id = 1 OR g.game_name = 'Tetris' OR g.release_year > 2020;",
      );
    });

    it("should handle inline OR with joins", () => {
      const query = queryBuilder
        .from<TableFields, "g">("games", "g")
        .leftJoin<TableFields2, "d">("developers", "d")
        .on({ "g.game_id": "d.game_id" })
        .where({
          "g.game_id": 1,
          or: [{ "d.description": { $like: "%action%" } }],
        })
        .select({
          "g.game_id": "id",
          "g.game_name": "name",
          "d.description": "desc",
        });

      const sql = query.toString();
      expect(sql).toBe(
        "SELECT g.game_id AS id, g.game_name AS name, d.description AS desc FROM games g LEFT JOIN developers d ON g.game_id = d.game_id WHERE g.game_id = 1 OR d.description LIKE '%action%';",
      );
    });
  });
});
