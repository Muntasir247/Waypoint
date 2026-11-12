/**
 * Task Dependency and Cycle Prevention Logic
 *
 * Implements Directed Acyclic Graph (DAG) cycle prevention and
 * checks that prerequisites are DONE before a task can start (IN_PROGRESS).
 */

export interface DependencyEdge {
  taskId: string;
  dependsOnTaskId: string;
}

/**
 * Checks if adding an edge (taskId -> dependsOnTaskId) introduces a cycle in the dependency graph.
 * In Waypoint, "taskId depends on dependsOnTaskId" means dependsOnTaskId must finish before taskId.
 * Therefore, a directed dependency chain from A to B means A requires B.
 * If B already requires A (directly or transitively), adding A requires B would create a cycle (deadlock).
 */
export function wouldCreateCycle(
  existingEdges: DependencyEdge[],
  newEdge: { taskId: string; dependsOnTaskId: string },
): boolean {
  if (newEdge.taskId === newEdge.dependsOnTaskId) {
    return true;
  }

  // Build adjacency list: node -> array of nodes it depends on
  const graph = new Map<string, Set<string>>();

  for (const edge of existingEdges) {
    if (!graph.has(edge.taskId)) {
      graph.set(edge.taskId, new Set());
    }
    graph.get(edge.taskId)!.add(edge.dependsOnTaskId);
  }

  // To test if newEdge.taskId depends on newEdge.dependsOnTaskId creates a cycle,
  // we check if newEdge.dependsOnTaskId can already reach newEdge.taskId through existing edges.
  // BFS or DFS from dependsOnTaskId:
  const visited = new Set<string>();
  const queue: string[] = [newEdge.dependsOnTaskId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === newEdge.taskId) {
      return true; // Cycle detected!
    }

    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = graph.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }
  }

  return false;
}

export interface DependencyTaskStatus {
  id: string;
  title: string;
  status: string;
}

export interface PrerequisiteCheckResult {
  canStart: boolean;
  unresolvedDependencies: DependencyTaskStatus[];
  message?: string;
}

/**
 * Verifies that all prerequisites are completed (DONE) before a task can transition to IN_PROGRESS.
 */
export function checkPrerequisitesForInProgress(
  prerequisites: DependencyTaskStatus[],
): PrerequisiteCheckResult {
  const unresolved = prerequisites.filter((task) => task.status !== "DONE");

  if (unresolved.length === 0) {
    return {
      canStart: true,
      unresolvedDependencies: [],
    };
  }

  const taskTitles = unresolved.map((t) => `"${t.title}" (${t.status})`).join(", ");
  return {
    canStart: false,
    unresolvedDependencies: unresolved,
    message: `Cannot start task: Unresolved prerequisite task(s): ${taskTitles}. All dependencies must be marked DONE first.`,
  };
}
