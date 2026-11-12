import { describe, it, expect } from "vitest";
import {
  parseDate,
  formatDate,
  formatDateFull,
  isOverdue,
  isDueSoon,
  isSameDay,
  getCalendarGrid,
  toDateString,
  formatMonthYear,
} from "./date-utils";

describe("Date utilities", () => {
  it("parses valid dates and nulls correctly", () => {
    expect(parseDate(null)).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate("not-a-date")).toBeNull();
    expect(parseDate("2026-11-12T10:00:00Z")).toBeInstanceOf(Date);
  });

  it("formats dates into readable strings", () => {
    const d = new Date("2026-11-12T12:00:00Z");
    expect(formatDate(d)).toBe("Nov 12");
    expect(formatDateFull(d)).toContain("2026");
    expect(formatDate(null)).toBe("No date");
  });

  it("checks overdue status accurately", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const future = new Date();
    future.setDate(future.getDate() + 5);

    expect(isOverdue(past, "TODO")).toBe(true);
    expect(isOverdue(past, "DONE")).toBe(false); // Done tasks are not marked overdue
    expect(isOverdue(future, "TODO")).toBe(false);
    expect(isOverdue(null, "TODO")).toBe(false);
  });

  it("identifies dates due soon", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 20);

    expect(isDueSoon(tomorrow, 3)).toBe(true);
    expect(isDueSoon(farFuture, 3)).toBe(false);
  });

  it("builds a full calendar grid with proper days and months", () => {
    const grid = getCalendarGrid(2026, 10); // Nov 2026
    expect(grid.length % 7).toBe(0);
    const novDays = grid.filter((g) => g.isCurrentMonth);
    expect(novDays.length).toBe(30);
  });

  it("converts date to YYYY-MM-DD string and formats month/year", () => {
    const d = new Date(2026, 10, 15);
    const d2 = new Date(2026, 10, 15);
    expect(isSameDay(d, d2)).toBe(true);
    expect(toDateString(d)).toBe("2026-11-15");
    expect(formatMonthYear(2026, 10)).toBe("November 2026");
  });
});
