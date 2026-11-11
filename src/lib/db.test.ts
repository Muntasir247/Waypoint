import { describe, it, expect } from "vitest";
import { db } from "./db";

describe("Database client", () => {
  it("initializes db client instance", () => {
    expect(db).toBeDefined();
    expect(typeof db.user.findMany).toBe("function");
    expect(typeof db.workspace.findMany).toBe("function");
    expect(typeof db.task.findMany).toBe("function");
    expect(typeof db.membership.findMany).toBe("function");
  });
});
