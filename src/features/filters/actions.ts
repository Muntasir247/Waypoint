"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUserAndWorkspace } from "@/features/workspaces/actions";
import { createSavedFilterSchema, type CreateSavedFilterInput, type FilterQuery } from "./schemas";

export interface SavedFilterItem {
  id: string;
  name: string;
  query: FilterQuery;
  createdAt: string;
}

/**
 * Get all saved filters for the current user in the active workspace.
 */
export async function getSavedFiltersAction(): Promise<{
  filters: SavedFilterItem[];
  error: string | null;
}> {
  const { user, workspace } = await getCurrentUserAndWorkspace();
  if (!user || !workspace) {
    return { filters: [], error: "Authentication and active workspace required" };
  }

  const list = await db.savedFilter.findMany({
    where: {
      userId: user.id,
      workspaceId: workspace.id,
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted: SavedFilterItem[] = list.map((item) => ({
    id: item.id,
    name: item.name,
    query: item.query as FilterQuery,
    createdAt: item.createdAt.toISOString(),
  }));

  return { filters: formatted, error: null };
}

/**
 * Create a new saved filter for current user in active workspace.
 */
export async function createSavedFilterAction(input: CreateSavedFilterInput): Promise<{
  filter: SavedFilterItem | null;
  error: string | null;
}> {
  const { user, workspace } = await getCurrentUserAndWorkspace();
  if (!user || !workspace) {
    return { filter: null, error: "Authentication and active workspace required" };
  }

  const parsed = createSavedFilterSchema.safeParse(input);
  if (!parsed.success) {
    return { filter: null, error: parsed.error.issues[0]?.message || "Invalid filter data" };
  }

  const created = await db.savedFilter.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      name: parsed.data.name.trim(),
      query: parsed.data.query as object,
    },
  });

  revalidatePath("/board");
  revalidatePath("/my-tasks");
  return {
    filter: {
      id: created.id,
      name: created.name,
      query: created.query as FilterQuery,
      createdAt: created.createdAt.toISOString(),
    },
    error: null,
  };
}

/**
 * Delete a saved filter (must belong to the current user in the active workspace).
 */
export async function deleteSavedFilterAction(filterId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const { user, workspace } = await getCurrentUserAndWorkspace();
  if (!user || !workspace) {
    return { success: false, error: "Authentication and active workspace required" };
  }

  const existing = await db.savedFilter.findUnique({
    where: { id: filterId },
  });

  if (!existing || existing.userId !== user.id || existing.workspaceId !== workspace.id) {
    return { success: false, error: "Filter not found or unauthorized" };
  }

  await db.savedFilter.delete({
    where: { id: filterId },
  });

  revalidatePath("/board");
  revalidatePath("/my-tasks");
  return { success: true, error: null };
}
