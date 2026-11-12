import { Role } from "@prisma/client";

export type PermissionAction =
  | "view:workspace"
  | "view:projects"
  | "view:tasks"
  | "create:projects"
  | "edit:projects"
  | "delete:projects"
  | "create:sprints"
  | "edit:sprints"
  | "delete:sprints"
  | "create:milestones"
  | "edit:milestones"
  | "delete:milestones"
  | "create:tasks"
  | "edit:task"
  | "assign:tasks"
  | "update_status:task"
  | "delete:task"
  | "create:comments"
  | "log_time"
  | "manage:members"
  | "manage:invites"
  | "manage:roles"
  | "configure:scoring"
  | "view:leaderboard"
  | "view:reports"
  | "view:audit_log"
  | "bulk:reassign";

export interface PermissionUserMembership {
  id: string;
  role: Role | "ADMIN" | "DEVELOPER" | "VIEWER";
  userId?: string;
  workspaceId?: string;
}

export interface TaskResource {
  id?: string;
  assigneeId?: string | null;
  createdById?: string | null;
}

export interface WorkspaceResource {
  id?: string;
  allowDeveloperCreateTasks?: boolean;
}

export interface MemberResource {
  id: string;
  role: Role | "ADMIN" | "DEVELOPER" | "VIEWER";
  totalAdminsInWorkspace?: number;
}

export type PermissionResource =
  | { type: "task"; task: TaskResource; workspace?: WorkspaceResource }
  | { type: "workspace"; workspace: WorkspaceResource }
  | { type: "member"; member: MemberResource }
  | TaskResource
  | WorkspaceResource
  | MemberResource
  | undefined;

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized: You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Central authorization check based on Section 5 RBAC matrix.
 */
export function can(
  membership: PermissionUserMembership | null | undefined,
  action: PermissionAction,
  resource?: PermissionResource,
): boolean {
  if (!membership) {
    return false;
  }

  const role = membership.role;

  switch (action) {
    // -------------------------------------------------------------------------
    // Read-only actions (Admin, Developer, Viewer)
    // -------------------------------------------------------------------------
    case "view:workspace":
    case "view:projects":
    case "view:tasks":
    case "view:leaderboard":
    case "view:reports":
      return true;

    // -------------------------------------------------------------------------
    // Admin only actions
    // -------------------------------------------------------------------------
    case "create:projects":
    case "edit:projects":
    case "delete:projects":
    case "create:sprints":
    case "edit:sprints":
    case "delete:sprints":
    case "create:milestones":
    case "edit:milestones":
    case "delete:milestones":
    case "assign:tasks":
    case "delete:task":
    case "manage:members":
    case "manage:invites":
    case "manage:roles":
    case "configure:scoring":
    case "view:audit_log":
    case "bulk:reassign":
      return role === "ADMIN";

    // -------------------------------------------------------------------------
    // Create tasks: Admin, or Developer if workspace setting allows it
    // -------------------------------------------------------------------------
    case "create:tasks": {
      if (role === "ADMIN") return true;
      if (role === "DEVELOPER") {
        const ws = extractWorkspaceResource(resource);
        return Boolean(ws?.allowDeveloperCreateTasks);
      }
      return false;
    }

    // -------------------------------------------------------------------------
    // Edit task details:
    // Admin (any task)
    // Developer (only own assigned task description/checklist)
    // -------------------------------------------------------------------------
    case "edit:task": {
      if (role === "ADMIN") return true;
      if (role === "DEVELOPER") {
        const task = extractTaskResource(resource);
        if (!task) return false;
        return task.assigneeId === membership.id;
      }
      return false;
    }

    // -------------------------------------------------------------------------
    // Update status of a task:
    // Admin (any task)
    // Developer (own assigned tasks only)
    // -------------------------------------------------------------------------
    case "update_status:task": {
      if (role === "ADMIN") return true;
      if (role === "DEVELOPER") {
        const task = extractTaskResource(resource);
        if (!task) return false;
        return task.assigneeId === membership.id;
      }
      return false;
    }

    // -------------------------------------------------------------------------
    // Comment / @mention: Admin, Developer
    // -------------------------------------------------------------------------
    case "create:comments":
      return role === "ADMIN" || role === "DEVELOPER";

    // -------------------------------------------------------------------------
    // Log time: Admin (any), Developer (own assigned tasks)
    // -------------------------------------------------------------------------
    case "log_time": {
      if (role === "ADMIN") return true;
      if (role === "DEVELOPER") {
        const task = extractTaskResource(resource);
        if (!task) return false;
        return task.assigneeId === membership.id;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Asserts that the membership has the permission, otherwise throws AuthorizationError.
 */
export function assertCan(
  membership: PermissionUserMembership | null | undefined,
  action: PermissionAction,
  resource?: PermissionResource,
): asserts membership is PermissionUserMembership {
  if (!can(membership, action, resource)) {
    throw new AuthorizationError(
      `Permission denied: Action '${action}' is not permitted for role '${membership?.role || "GUEST"}'.`,
    );
  }
}

/**
 * Protects against removing or demoting the last admin in a workspace.
 */
export function canDemoteOrRemoveAdmin(
  targetMemberRole: Role | "ADMIN" | "DEVELOPER" | "VIEWER",
  totalAdminsInWorkspace: number,
): boolean {
  if (targetMemberRole === "ADMIN" && totalAdminsInWorkspace <= 1) {
    return false;
  }
  return true;
}

// Helpers to extract resource variants
function extractTaskResource(resource?: PermissionResource): TaskResource | undefined {
  if (!resource) return undefined;
  if ("type" in resource && resource.type === "task") {
    return resource.task;
  }
  if ("assigneeId" in resource) {
    return resource as TaskResource;
  }
  return undefined;
}

function extractWorkspaceResource(resource?: PermissionResource): WorkspaceResource | undefined {
  if (!resource) return undefined;
  if ("type" in resource && resource.type === "workspace") {
    return resource.workspace;
  }
  if ("type" in resource && resource.type === "task" && resource.workspace) {
    return resource.workspace;
  }
  if ("allowDeveloperCreateTasks" in resource) {
    return resource as WorkspaceResource;
  }
  return undefined;
}
