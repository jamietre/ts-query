import { describe, it, expect } from "vitest";
import { queryBuilder } from "../src/index.js";
import { field } from "../src/caseBuilder.js";

interface User {
  id: number;
  name: string;
  age: number;
  status: string;
}

describe("CASE functionality", () => {
  it("should create a basic CASE statement", () => {
    const query = queryBuilder
      .from<User>("users")
      .case()
      .when({ age: { $lt: 18 } })
      .then("Minor")
      .when({ age: { $gte: 65 } })
      .then("Senior")
      .else("Adult")
      .endAs("category");

    const caseStr = query.toString();
    expect(caseStr).toBe("SELECT CASE WHEN age < 18 THEN 'Minor' WHEN age >= 65 THEN 'Senior' ELSE 'Adult' END AS category FROM users;");
  });

  it("should work with field references in THEN clauses", () => {
    const query = queryBuilder
      .from<User>("users")
      .case()
      .when({ status: "active" })
      .then(field("name"))
      .else("Unknown");

    const caseStr = query.toString();
    expect(caseStr).toBe("SELECT CASE WHEN status = 'active' THEN name ELSE 'Unknown' END FROM users;");
  });

  it("should work without ELSE clause", () => {
    const query = queryBuilder
      .from<User>("users")
      .case()
      .when({ age: { $gte: 18 } })
      .then("Adult")
      .endAs("category");

    const caseStr = query.toString();
    expect(caseStr).toBe("SELECT CASE WHEN age >= 18 THEN 'Adult' END AS category FROM users;");
  });

  it("should handle multiple conditions in WHEN", () => {
    const query = queryBuilder
      .from<User>("users")
      .case()
      .when({ age: { $gte: 18 }, status: "active" })
      .then("Active Adult")
      .else("Other");

    const caseStr = query.toString();
    expect(caseStr).toBe("SELECT CASE WHEN age >= 18 AND status = 'active' THEN 'Active Adult' ELSE 'Other' END FROM users;");
  });

  it("should work as part of SELECT fields", () => {
    const ageCategory = queryBuilder
      .from<User>("users")
      .case()
      .when({ age: { $lt: 18 } })
      .then("Minor")
      .when({ age: { $gte: 65 } })
      .then("Senior")
      .else("Adult")
      .endAs("age_category");

    const query = queryBuilder.from<User>("users").select(["name", { [ageCategory.getExpression()]: true }]);

    const sql = query.toString();
    expect(sql).toContain(
      "SELECT name, CASE WHEN age < 18 THEN 'Minor' WHEN age >= 65 THEN 'Senior' ELSE 'Adult' END AS age_category FROM users;",
    );
  });
});
