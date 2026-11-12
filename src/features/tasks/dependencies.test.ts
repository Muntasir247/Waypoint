import { describe, it, expect } from "vitest";
import {
  wouldCreateCycle,
  checkPrerequisitesForInProgress,
  DependencyEdge,
  DependencyTaskStatus,
} from "./dependencies";

describe("Task Dependency Cycle Prevention (DAG)", () => {
  it("prevents self-dependency (A depends on A)", () => {
    const isCycle = wouldCreateCycle([], { taskId: "task_A", dependsOnTaskId: "task_A" });
    expect(isCycle).toBe(true);
  });

  it("allows non-cyclic dependency addition", () => {
    const edges: DependencyEdge[] = [
      { taskId: "task_B", dependsOnTaskId: "task_A" }, // B requires A
    ];
    // Adding C requires B is valid (C -> B -> A)
    const isCycle = wouldCreateCycle(edges, { taskId: "task_C", dependsOnTaskId: "task_B" });
    expect(isCycle).toBe(false);
  });

  it("detects direct 2-node cycle (A requires B, B requires A)", () => {
    const edges: DependencyEdge[] = [
      { taskId: "task_B", dependsOnTaskId: "task_A" }, // B requires A
    ];
    // Attempting to add A requires B
    const isCycle = wouldCreateCycle(edges, { taskId: "task_A", dependsOnTaskId: "task_B" });
    expect(isCycle).toBe(true);
  });

  it("detects transitive 3-node cycle (A -> B -> C -> A)", () => {
    const edges: DependencyEdge[] = [
      { taskId: "task_A", dependsOnTaskId: "task_B" },
      { taskId: "task_B", dependsOnTaskId: "task_C" },
    ];
    // C requires A creates A -> B -> C -> A
    const isCycle = wouldCreateCycle(edges, { taskId: "task_C", dependsOnTaskId: "task_A" });
    expect(isCycle).toBe(true);
  });

  it("detects complex multi-branch cycle", () => {
    const edges: DependencyEdge[] = [
      { taskId: "task_A", dependsOnTaskId: "task_B" },
      { taskId: "task_B", dependsOnTaskId: "task_C" },
      { taskId: "task_A", dependsOnTaskId: "task_D" },
      { taskId: "task_D", dependsOnTaskId: "task_E" },
    ];
    // E requires A creates cycle: A -> D -> E -> A
    const isCycle = wouldCreateCycle(edges, { taskId: "task_E", dependsOnTaskId: "task_A" });
    expect(isCycle).toBe(true);

    // C requires A creates cycle: A -> B -> C -> A
    const isCycleToC = wouldCreateCycle(edges, { taskId: "task_C", dependsOnTaskId: "task_A" });
    expect(isCycleToC).toBe(true);

    // E requires B is a valid DAG extension (A -> D -> E -> B -> C)
    const isSafeToB = wouldCreateCycle(edges, { taskId: "task_E", dependsOnTaskId: "task_B" });
    expect(isSafeToB).toBe(false);

    // E requires C is valid
    const isSafe = wouldCreateCycle(edges, { taskId: "task_E", dependsOnTaskId: "task_C" });
    expect(isSafe).toBe(false);
  });
});

describe("Dependency Status Prerequisites for IN_PROGRESS", () => {
  it("allows starting task when there are no prerequisites", () => {
    const result = checkPrerequisitesForInProgress([]);
    expect(result.canStart).toBe(true);
    expect(result.unresolvedDependencies).toHaveLength(0);
  });

  it("allows starting task when all prerequisites are DONE", () => {
    const prerequisites: DependencyTaskStatus[] = [
      { id: "dep_1", title: "Setup Database", status: "DONE" },
      { id: "dep_2", title: "Configure Auth", status: "DONE" },
    ];
    const result = checkPrerequisitesForInProgress(prerequisites);
    expect(result.canStart).toBe(true);
    expect(result.unresolvedDependencies).toHaveLength(0);
  });

  it("blocks starting task when any prerequisite is not DONE (e.g. IN_PROGRESS, TODO, BLOCKED)", () => {
    const prerequisites: DependencyTaskStatus[] = [
      { id: "dep_1", title: "Setup Database", status: "DONE" },
      { id: "dep_2", title: "Configure Auth", status: "IN_REVIEW" },
      { id: "dep_3", title: "Deploy Ingress", status: "BLOCKED" },
    ];
    const result = checkPrerequisitesForInProgress(prerequisites);
    expect(result.canStart).toBe(false);
    expect(result.unresolvedDependencies).toHaveLength(2);
    expect(result.message).toContain("Configure Auth");
    expect(result.message).toContain("Deploy Ingress");
  });
});
