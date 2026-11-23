"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import {
  createProjectSchema,
  updateProjectSchema,
  createSprintSchema,
  updateSprintSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type CreateSprintInput,
  type UpdateSprintInput,
  type CreateMilestoneInput,
  type UpdateMilestoneInput,
} from "./schemas";

/**
 * Get all projects for the current workspace with task and sprint stats.
 */
export async function getProjectsAction() {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "No active workspace found", projects: [] };
  }

  assertCan(membership, "view:projects");

  try {
    const projects = await db.project.findMany({
      where: { workspaceId: workspace.id },
      include: {
        sprints: {
          where: { status: "ACTIVE" },
          take: 1,
        },
        tasks: {
          select: {
            id: true,
            status: true,
            estimatePoints: true,
          },
        },
        milestones: {
          select: {
            id: true,
            name: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === "DONE").length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const totalPoints = p.tasks.reduce((sum, t) => sum + (t.estimatePoints || 0), 0);
      const completedPoints = p.tasks
        .filter((t) => t.status === "DONE")
        .reduce((sum, t) => sum + (t.estimatePoints || 0), 0);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        targetDate: p.targetDate ? p.targetDate.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        activeSprint: p.sprints[0] ? { id: p.sprints[0].id, name: p.sprints[0].name } : null,
        milestonesCount: p.milestones.length,
        totalTasks,
        completedTasks,
        progressPercent,
        totalPoints,
        completedPoints,
      };
    });

    return { projects: formatted, error: null };
  } catch (e) {
    console.error("getProjectsAction error:", e);
    return { projects: [], error: "Failed to load projects" };
  }
}

/**
 * Get detailed project view including backlog, sprints, milestones, and metrics.
 */
export async function getProjectDetailAction(projectId: string) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "No active workspace found", project: null };
  }

  assertCan(membership, "view:projects");

  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId: workspace.id },
    include: {
      sprints: {
        orderBy: { createdAt: "desc" },
      },
      milestones: {
        orderBy: { dueDate: "asc" },
      },
      tasks: {
        include: {
          assignee: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          labels: {
            include: { label: true },
          },
          dependencies: {
            include: {
              dependsOnTask: {
                select: { id: true, title: true, status: true },
              },
            },
          },
          checklist: true,
        },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!project) {
    return { error: "Project not found", project: null };
  }

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const blockedTasks = project.tasks.filter((t) => t.status === "BLOCKED").length;
  const inProgressTasks = project.tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const totalPoints = project.tasks.reduce((sum, t) => sum + (t.estimatePoints || 0), 0);
  const completedPoints = project.tasks
    .filter((t) => t.status === "DONE")
    .reduce((sum, t) => sum + (t.estimatePoints || 0), 0);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    project: {
      ...project,
      targetDate: project.targetDate ? project.targetDate.toISOString() : null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      sprints: project.sprints.map((s) => ({
        ...s,
        startDate: s.startDate ? s.startDate.toISOString() : null,
        endDate: s.endDate ? s.endDate.toISOString() : null,
        createdAt: s.createdAt.toISOString(),
      })),
      milestones: project.milestones.map((m) => ({
        ...m,
        dueDate: m.dueDate ? m.dueDate.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      })),
      tasks: project.tasks.map((t) => ({
        ...t,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      metrics: {
        totalTasks,
        completedTasks,
        blockedTasks,
        inProgressTasks,
        totalPoints,
        completedPoints,
        progressPercent,
      },
    },
    error: null,
  };
}

/**
 * Create a new project (Admin only).
 */
export async function createProjectAction(input: CreateProjectInput) {
  const { workspace, membership, user } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership || !user) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "create:projects");

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const targetDate = parsed.data.targetDate ? new Date(parsed.data.targetDate) : null;

  const project = await db.project.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status,
      targetDate,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/");
  return { project, error: null };
}

/**
 * Update an existing project (Admin only).
 */
export async function updateProjectAction(input: UpdateProjectInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "edit:projects");

  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const existing = await db.project.findFirst({
    where: { id: parsed.data.id, workspaceId: workspace.id },
  });

  if (!existing) {
    return { error: "Project not found" };
  }

  const targetDate =
    parsed.data.targetDate !== undefined
      ? parsed.data.targetDate
        ? new Date(parsed.data.targetDate)
        : null
      : undefined;

  const updated = await db.project.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status,
      targetDate,
    },
  });

  revalidatePath(`/projects/${parsed.data.id}`);
  revalidatePath("/projects");
  return { project: updated, error: null };
}

/**
 * Delete a project (Admin only, audit logged).
 */
export async function deleteProjectAction(projectId: string) {
  const { workspace, membership, user } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership || !user) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "delete:projects");

  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId: workspace.id },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  await db.$transaction([
    db.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorId: membership.id,
        action: "PROJECT_DELETED",
        target: project.name,
        metadata: { projectId: project.id, projectName: project.name },
      },
    }),
    db.project.delete({
      where: { id: projectId },
    }),
  ]);

  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true, error: null };
}

/**
 * Create a sprint (Admin only).
 */
export async function createSprintAction(input: CreateSprintInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "create:sprints");

  const parsed = createSprintSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const project = await db.project.findFirst({
    where: { id: parsed.data.projectId, workspaceId: workspace.id },
  });

  if (!project) {
    return { error: "Project not found in this workspace" };
  }

  const sprint = await db.sprint.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
      goal: parsed.data.goal,
      status: parsed.data.status,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });

  revalidatePath(`/projects/${project.id}`);
  return { sprint, error: null };
}

/**
 * Update sprint (Admin only).
 */
export async function updateSprintAction(input: UpdateSprintInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "edit:sprints");

  const parsed = updateSprintSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const sprint = await db.sprint.findUnique({
    where: { id: parsed.data.id },
    include: { project: true },
  });

  if (!sprint || sprint.project.workspaceId !== workspace.id) {
    return { error: "Sprint not found" };
  }

  const updated = await db.sprint.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      goal: parsed.data.goal,
      status: parsed.data.status,
      startDate:
        parsed.data.startDate !== undefined
          ? parsed.data.startDate
            ? new Date(parsed.data.startDate)
            : null
          : undefined,
      endDate:
        parsed.data.endDate !== undefined
          ? parsed.data.endDate
            ? new Date(parsed.data.endDate)
            : null
          : undefined,
    },
  });

  revalidatePath(`/projects/${sprint.projectId}`);
  return { sprint: updated, error: null };
}

/**
 * Delete sprint (Admin only).
 */
export async function deleteSprintAction(sprintId: string) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "delete:sprints");

  const sprint = await db.sprint.findUnique({
    where: { id: sprintId },
    include: { project: true },
  });

  if (!sprint || sprint.project.workspaceId !== workspace.id) {
    return { error: "Sprint not found" };
  }

  await db.sprint.delete({ where: { id: sprintId } });

  revalidatePath(`/projects/${sprint.projectId}`);
  return { success: true, error: null };
}

/**
 * Create a milestone (Admin only).
 */
export async function createMilestoneAction(input: CreateMilestoneInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "create:milestones");

  const parsed = createMilestoneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const project = await db.project.findFirst({
    where: { id: parsed.data.projectId, workspaceId: workspace.id },
  });

  if (!project) {
    return { error: "Project not found in this workspace" };
  }

  const milestone = await db.milestone.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });

  revalidatePath(`/projects/${project.id}`);
  return { milestone, error: null };
}

/**
 * Update milestone (Admin only).
 */
export async function updateMilestoneAction(input: UpdateMilestoneInput) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "edit:milestones");

  const parsed = updateMilestoneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const milestone = await db.milestone.findUnique({
    where: { id: parsed.data.id },
    include: { project: true },
  });

  if (!milestone || milestone.project.workspaceId !== workspace.id) {
    return { error: "Milestone not found" };
  }

  const updated = await db.milestone.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      dueDate:
        parsed.data.dueDate !== undefined
          ? parsed.data.dueDate
            ? new Date(parsed.data.dueDate)
            : null
          : undefined,
    },
  });

  revalidatePath(`/projects/${milestone.projectId}`);
  return { milestone: updated, error: null };
}

/**
 * Delete milestone (Admin only).
 */
export async function deleteMilestoneAction(milestoneId: string) {
  const { workspace, membership } = await getCurrentUserAndWorkspace();
  if (!workspace || !membership) {
    return { error: "Authentication required" };
  }

  assertCan(membership, "delete:milestones");

  const milestone = await db.milestone.findUnique({
    where: { id: milestoneId },
    include: { project: true },
  });

  if (!milestone || milestone.project.workspaceId !== workspace.id) {
    return { error: "Milestone not found" };
  }

  await db.milestone.delete({ where: { id: milestoneId } });

  revalidatePath(`/projects/${milestone.projectId}`);
  return { success: true, error: null };
}
