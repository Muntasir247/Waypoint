import { describe, it, expect } from "vitest";
import {
  can,
  assertCan,
  canDemoteOrRemoveAdmin,
  AuthorizationError,
  PermissionUserMembership,
  PermissionAction,
} from "./permissions";

describe("RBAC Permissions Matrix (Section 5)", () => {
  const adminMembership: PermissionUserMembership = {
    id: "mem_admin_1",
    role: "ADMIN",
    userId: "usr_admin",
    workspaceId: "ws_1",
  };

  const devMembership: PermissionUserMembership = {
    id: "mem_dev_1",
    role: "DEVELOPER",
    userId: "usr_dev",
    workspaceId: "ws_1",
  };

  const viewerMembership: PermissionUserMembership = {
    id: "mem_viewer_1",
    role: "VIEWER",
    userId: "usr_viewer",
    workspaceId: "ws_1",
  };

  const ownTask = {
    id: "task_1",
    assigneeId: "mem_dev_1",
    createdById: "mem_admin_1",
  };

  const otherTask = {
    id: "task_2",
    assigneeId: "mem_dev_2",
    createdById: "mem_admin_1",
  };

  const unassignedTask = {
    id: "task_3",
    assigneeId: null,
    createdById: "mem_admin_1",
  };

  describe("Read-only workspace actions", () => {
    const viewActions: PermissionAction[] = [
      "view:workspace",
      "view:projects",
      "view:tasks",
      "view:leaderboard",
      "view:reports",
    ];

    viewActions.forEach((action) => {
      it(`allows Admin, Developer, and Viewer to '${action}'`, () => {
        expect(can(adminMembership, action)).toBe(true);
        expect(can(devMembership, action)).toBe(true);
        expect(can(viewerMembership, action)).toBe(true);
      });

      it(`denies null or guest membership to '${action}'`, () => {
        expect(can(null, action)).toBe(false);
        expect(can(undefined, action)).toBe(false);
      });
    });
  });

  describe("Admin-only management and planning actions", () => {
    const adminOnlyActions: PermissionAction[] = [
      "create:projects",
      "edit:projects",
      "create:sprints",
      "edit:sprints",
      "create:milestones",
      "edit:milestones",
      "assign:tasks",
      "delete:task",
      "manage:members",
      "manage:invites",
      "manage:roles",
      "configure:scoring",
      "view:audit_log",
      "bulk:reassign",
    ];

    adminOnlyActions.forEach((action) => {
      it(`allows only Admin to '${action}'`, () => {
        expect(can(adminMembership, action)).toBe(true);
        expect(can(devMembership, action)).toBe(false);
        expect(can(viewerMembership, action)).toBe(false);
      });
    });
  });

  describe("Task Creation permissions", () => {
    it("allows Admin to create tasks regardless of workspace setting", () => {
      expect(can(adminMembership, "create:tasks")).toBe(true);
      expect(can(adminMembership, "create:tasks", { allowDeveloperCreateTasks: false })).toBe(true);
      expect(can(adminMembership, "create:tasks", { allowDeveloperCreateTasks: true })).toBe(true);
    });

    it("denies Developer to create tasks by default (allowDeveloperCreateTasks = false)", () => {
      expect(can(devMembership, "create:tasks")).toBe(false);
      expect(can(devMembership, "create:tasks", { allowDeveloperCreateTasks: false })).toBe(false);
    });

    it("allows Developer to create tasks when workspace allows it", () => {
      expect(can(devMembership, "create:tasks", { allowDeveloperCreateTasks: true })).toBe(true);
      expect(
        can(devMembership, "create:tasks", {
          type: "workspace",
          workspace: { allowDeveloperCreateTasks: true },
        }),
      ).toBe(true);
    });

    it("never allows Viewer to create tasks even if setting is enabled", () => {
      expect(can(viewerMembership, "create:tasks")).toBe(false);
      expect(can(viewerMembership, "create:tasks", { allowDeveloperCreateTasks: true })).toBe(
        false,
      );
    });
  });

  describe("Task Status Update permissions", () => {
    it("allows Admin to update status of ANY task", () => {
      expect(can(adminMembership, "update_status:task", ownTask)).toBe(true);
      expect(can(adminMembership, "update_status:task", otherTask)).toBe(true);
      expect(can(adminMembership, "update_status:task", unassignedTask)).toBe(true);
    });

    it("allows Developer to update status of OWN assigned tasks only", () => {
      expect(can(devMembership, "update_status:task", ownTask)).toBe(true);
      expect(can(devMembership, "update_status:task", otherTask)).toBe(false);
      expect(can(devMembership, "update_status:task", unassignedTask)).toBe(false);
    });

    it("denies Viewer from updating task status", () => {
      expect(can(viewerMembership, "update_status:task", ownTask)).toBe(false);
      expect(can(viewerMembership, "update_status:task", otherTask)).toBe(false);
    });
  });

  describe("Task Edit Details permissions", () => {
    it("allows Admin to edit any task", () => {
      expect(can(adminMembership, "edit:task", ownTask)).toBe(true);
      expect(can(adminMembership, "edit:task", otherTask)).toBe(true);
    });

    it("allows Developer to edit own assigned task", () => {
      expect(can(devMembership, "edit:task", ownTask)).toBe(true);
      expect(can(devMembership, "edit:task", otherTask)).toBe(false);
    });

    it("denies Viewer from editing tasks", () => {
      expect(can(viewerMembership, "edit:task", ownTask)).toBe(false);
      expect(can(viewerMembership, "edit:task", otherTask)).toBe(false);
    });
  });

  describe("Task Deletion permissions", () => {
    it("strictly allows only Admin to delete tasks", () => {
      expect(can(adminMembership, "delete:task", ownTask)).toBe(true);
      expect(can(adminMembership, "delete:task", otherTask)).toBe(true);
      expect(can(devMembership, "delete:task", ownTask)).toBe(false);
      expect(can(devMembership, "delete:task", otherTask)).toBe(false);
      expect(can(viewerMembership, "delete:task", ownTask)).toBe(false);
    });
  });

  describe("Comments and Mentions", () => {
    it("allows Admin and Developer to comment", () => {
      expect(can(adminMembership, "create:comments")).toBe(true);
      expect(can(devMembership, "create:comments")).toBe(true);
    });

    it("denies Viewer from commenting", () => {
      expect(can(viewerMembership, "create:comments")).toBe(false);
    });
  });

  describe("Time Logging permissions", () => {
    it("allows Admin to log time on any task", () => {
      expect(can(adminMembership, "log_time", ownTask)).toBe(true);
      expect(can(adminMembership, "log_time", otherTask)).toBe(true);
    });

    it("allows Developer to log time on own assigned task only", () => {
      expect(can(devMembership, "log_time", ownTask)).toBe(true);
      expect(can(devMembership, "log_time", otherTask)).toBe(false);
    });

    it("denies Viewer from logging time", () => {
      expect(can(viewerMembership, "log_time", ownTask)).toBe(false);
    });
  });

  describe("assertCan helper", () => {
    it("succeeds when permission check passes", () => {
      expect(() => assertCan(adminMembership, "manage:members")).not.toThrow();
    });

    it("throws AuthorizationError when permission check fails", () => {
      expect(() => assertCan(devMembership, "manage:members")).toThrow(AuthorizationError);
      expect(() => assertCan(viewerMembership, "delete:task")).toThrow(AuthorizationError);
      expect(() => assertCan(null, "view:tasks")).toThrow(AuthorizationError);
    });
  });

  describe("Last Admin Protection rule", () => {
    it("prevents demoting or removing the only Admin", () => {
      expect(canDemoteOrRemoveAdmin("ADMIN", 1)).toBe(false);
      expect(canDemoteOrRemoveAdmin("ADMIN", 0)).toBe(false);
    });

    it("allows demoting or removing an Admin when there are multiple Admins", () => {
      expect(canDemoteOrRemoveAdmin("ADMIN", 2)).toBe(true);
      expect(canDemoteOrRemoveAdmin("ADMIN", 3)).toBe(true);
    });

    it("allows demoting or removing Developers or Viewers regardless of admin count", () => {
      expect(canDemoteOrRemoveAdmin("DEVELOPER", 1)).toBe(true);
      expect(canDemoteOrRemoveAdmin("VIEWER", 1)).toBe(true);
    });
  });
});
