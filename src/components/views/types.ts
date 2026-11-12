import { TaskStatus, Priority } from "@prisma/client";

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  estimatePoints: number;
  dueDate?: string | null;
  position: number;
  blockedReason?: string | null;
  completedAt?: string | null;
  createdAt: string;
  project: { id: string; name: string };
  sprint?: { id: string; name: string; status?: string } | null;
  milestone?: { id: string; name: string; dueDate?: string | null } | null;
  assignee?: {
    id: string;
    role: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  labels?: { id: string; name: string; color: string }[];
  checklistTotal?: number;
  checklistDone?: number;
  dependenciesCount?: number;
  commentsCount?: number;
  attachmentsCount?: number;
  timeEntriesCount?: number;
}

export type ViewMode = "kanban" | "list" | "calendar" | "timeline";

export interface FilterState {
  search: string;
  assigneeIds: string[];
  statuses: TaskStatus[];
  priorities: Priority[];
  labels: string[];
  dueDate: "all" | "overdue" | "today" | "this_week" | "next_week" | "no_date";
  projectId: string;
  sprintId: string;
}

export const INITIAL_FILTER_STATE: FilterState = {
  search: "",
  assigneeIds: [],
  statuses: [],
  priorities: [],
  labels: [],
  dueDate: "all",
  projectId: "",
  sprintId: "",
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  TODO: {
    label: "To Do",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    dot: "bg-sky-500",
  },
  IN_REVIEW: {
    label: "In Review",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  DONE: {
    label: "Done",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  BLOCKED: {
    label: "Blocked",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; badge: string; text: string; dot: string }
> = {
  LOW: {
    label: "Low",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
  MEDIUM: {
    label: "Medium",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    text: "text-blue-500",
    dot: "bg-blue-500",
  },
  HIGH: {
    label: "High",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  CRITICAL: {
    label: "Critical",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    text: "text-rose-600",
    dot: "bg-rose-500",
  },
};
