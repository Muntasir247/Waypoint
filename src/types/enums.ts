export const Role = {
  ADMIN: "ADMIN",
  DEVELOPER: "DEVELOPER",
  VIEWER: "VIEWER",
} as const;
export type Role = "ADMIN" | "DEVELOPER" | "VIEWER" | string;

export const Availability = {
  ACTIVE: "ACTIVE",
  ON_LEAVE: "ON_LEAVE",
  OVERLOADED: "OVERLOADED",
} as const;
export type Availability = "ACTIVE" | "ON_LEAVE" | "OVERLOADED" | string;

export const ProjectStatus = {
  PLANNING: "PLANNING",
  ACTIVE: "ACTIVE",
  ON_HOLD: "ON_HOLD",
  COMPLETED: "COMPLETED",
} as const;
export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | string;

export const SprintStatus = {
  PLANNED: "PLANNED",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const;
export type SprintStatus = "PLANNED" | "ACTIVE" | "CLOSED" | string;

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE",
  BLOCKED: "BLOCKED",
} as const;
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED" | string;

export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;

export const AttachmentType = {
  FILE: "FILE",
  LINK: "LINK",
} as const;
export type AttachmentType = "FILE" | "LINK" | string;
