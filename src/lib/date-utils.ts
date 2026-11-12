/**
 * Date utilities for Waypoint calendar, timeline, and task views.
 */

export function parseDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = parseDate(dateInput);
  if (!d) return "No date";
  return new Intl.DateTimeFormat("en-US", options || { month: "short", day: "numeric" }).format(d);
}

export function formatDateFull(dateInput: string | Date | null | undefined): string {
  const d = parseDate(dateInput);
  if (!d) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function isOverdue(
  dueDateInput: string | Date | null | undefined,
  status?: string,
): boolean {
  if (status === "DONE") return false;
  const due = parseDate(dueDateInput);
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const check = new Date(due);
  check.setHours(0, 0, 0, 0);
  return check < today;
}

export function isDueSoon(
  dueDateInput: string | Date | null | undefined,
  daysAhead: number = 3,
): boolean {
  const due = parseDate(dueDateInput);
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(today);
  target.setDate(target.getDate() + daysAhead);
  const check = new Date(due);
  check.setHours(0, 0, 0, 0);
  return check >= today && check <= target;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Generates a full 35-day or 42-day calendar grid (starting on Sunday) for a given month/year.
 */
export function getCalendarGrid(year: number, month: number): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grid: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    prevDate.setHours(0, 0, 0, 0);
    grid.push({
      date: prevDate,
      dateString: toDateString(prevDate),
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(prevDate, today),
    });
  }

  // Current month days
  const totalDays = lastDayOfMonth.getDate();
  for (let d = 1; d <= totalDays; d++) {
    const curDate = new Date(year, month, d);
    curDate.setHours(0, 0, 0, 0);
    grid.push({
      date: curDate,
      dateString: toDateString(curDate),
      dayNumber: d,
      isCurrentMonth: true,
      isToday: isSameDay(curDate, today),
    });
  }

  // Next month leading days to complete the 6-week or 5-week grid (multiples of 7)
  const remaining = (7 - (grid.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    nextDate.setHours(0, 0, 0, 0);
    grid.push({
      date: nextDate,
      dateString: toDateString(nextDate),
      dayNumber: d,
      isCurrentMonth: false,
      isToday: isSameDay(nextDate, today),
    });
  }

  return grid;
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(d);
}
