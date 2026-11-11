import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("handles conditional classes", () => {
    expect(cn("px-4", false && "py-2", "rounded")).toBe("px-4 rounded");
  });

  it("handles tailwind class conflicts gracefully", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
