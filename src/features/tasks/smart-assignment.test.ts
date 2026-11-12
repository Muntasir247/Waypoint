import { describe, it, expect } from "vitest";
import { rankTaskAssignmentCandidates, CandidateMember } from "./smart-assignment";

describe("Smart Assignment Algorithm (Section 7.2)", () => {
  const sampleCandidates: CandidateMember[] = [
    {
      id: "mem_sarah",
      name: "Sarah Chen",
      email: "sarah@acme.dev",
      role: "DEVELOPER",
      availability: "ACTIVE",
      skills: [
        { name: "TypeScript", level: 5 },
        { name: "PostgreSQL", level: 4 },
        { name: "Node.js", level: 5 },
      ],
      openEstimatePoints: 4, // 4/20 capacity
      completedTasksHistory: [
        { dueDate: "2024-10-01", completedAt: "2024-09-30" }, // On time
        { dueDate: "2024-10-05", completedAt: "2024-10-05" }, // On time
        { dueDate: "2024-10-10", completedAt: "2024-10-09" }, // On time
        { dueDate: "2024-10-15", completedAt: "2024-10-16" }, // Late
      ],
    },
    {
      id: "mem_elena",
      name: "Elena Rostova",
      email: "elena@acme.dev",
      role: "DEVELOPER",
      availability: "ACTIVE",
      skills: [
        { name: "React", level: 4 },
        { name: "CSS", level: 5 },
      ],
      openEstimatePoints: 12, // 12/20 capacity
      completedTasksHistory: [
        { dueDate: "2024-10-01", completedAt: "2024-10-01" },
        { dueDate: "2024-10-05", completedAt: "2024-10-05" },
      ],
    },
    {
      id: "mem_marcus",
      name: "Marcus Vance",
      email: "marcus@acme.dev",
      role: "DEVELOPER",
      availability: "OVERLOADED",
      skills: [{ name: "TypeScript", level: 5 }],
      openEstimatePoints: 21, // Over capacity (21/20)
    },
    {
      id: "mem_leave",
      name: "David Kim",
      email: "david@acme.dev",
      role: "DEVELOPER",
      availability: "ON_LEAVE",
      skills: [{ name: "TypeScript", level: 5 }],
      openEstimatePoints: 0,
    },
  ];

  it("excludes members who are ON_LEAVE", () => {
    const suggestions = rankTaskAssignmentCandidates({ labels: ["TypeScript"] }, sampleCandidates);

    const ids = suggestions.map((s) => s.membershipId);
    expect(ids).not.toContain("mem_leave");
  });

  it("prioritizes members with high skill match and low capacity load", () => {
    const suggestions = rankTaskAssignmentCandidates(
      { labels: ["TypeScript", "PostgreSQL"] },
      sampleCandidates,
    );

    expect(suggestions.length).toBeGreaterThan(0);
    // Sarah has top skills in TypeScript & Postgres with only 4 open points
    expect(suggestions[0].membershipId).toBe("mem_sarah");
    expect(suggestions[0].score).toBeGreaterThan(suggestions[1].score);
    expect(suggestions[0].reasons.some((r) => r.includes("Skill match"))).toBe(true);
    expect(suggestions[0].reasons.some((r) => r.includes("Available capacity"))).toBe(true);
  });

  it("flags overloaded members correctly", () => {
    const suggestions = rankTaskAssignmentCandidates({ labels: ["TypeScript"] }, sampleCandidates);

    const marcusSuggestion = suggestions.find((s) => s.membershipId === "mem_marcus");
    expect(marcusSuggestion).toBeDefined();
    expect(marcusSuggestion?.isOverloaded).toBe(true);
    expect(marcusSuggestion?.reasons.some((r) => r.includes("High workload"))).toBe(true);
  });

  it("returns at most 3 suggestions", () => {
    const suggestions = rankTaskAssignmentCandidates({ labels: ["TypeScript"] }, sampleCandidates);

    expect(suggestions.length).toBeLessThanOrEqual(3);
  });
});
