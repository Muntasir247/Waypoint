/**
 * Smart Assignment Algorithm
 *
 * Implements Section 7.2:
 * suitability = 0.5 × skillMatch + 0.3 × capacityScore + 0.2 × onTimeHistory
 *
 * Generates top 3 explainable assignment recommendations.
 */

export interface CandidateSkill {
  name: string;
  level: number; // 1 to 5
}

export interface CandidateMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED";
  skills: CandidateSkill[];
  openEstimatePoints: number;
  completedTasksHistory?: {
    dueDate?: Date | string | null;
    completedAt?: Date | string | null;
  }[];
}

export interface SmartAssignmentWeights {
  skillWeight?: number;
  capacityWeight?: number;
  historyWeight?: number;
  capacityLimit?: number;
}

export interface AssignmentSuggestion {
  membershipId: string;
  name: string;
  avatarUrl?: string | null;
  score: number; // 0 to 100
  reasons: string[];
  capacityPoints: number;
  capacityLimit: number;
  isOverloaded: boolean;
}

const DEFAULT_CAPACITY_LIMIT = 20;
const DEFAULT_SKILL_WEIGHT = 0.5;
const DEFAULT_CAPACITY_WEIGHT = 0.3;
const DEFAULT_HISTORY_WEIGHT = 0.2;

/**
 * Calculates suitability and ranks eligible members for a task.
 */
export function rankTaskAssignmentCandidates(
  task: {
    estimatePoints?: number;
    labels?: string[]; // label names or tags
  },
  candidates: CandidateMember[],
  weights?: SmartAssignmentWeights,
): AssignmentSuggestion[] {
  const capacityLimit = weights?.capacityLimit ?? DEFAULT_CAPACITY_LIMIT;
  const skillWeight = weights?.skillWeight ?? DEFAULT_SKILL_WEIGHT;
  const capacityWeight = weights?.capacityWeight ?? DEFAULT_CAPACITY_WEIGHT;
  const historyWeight = weights?.historyWeight ?? DEFAULT_HISTORY_WEIGHT;

  // Filter out members who are on leave
  const eligible = candidates.filter((c) => c.availability !== "ON_LEAVE");

  const taskLabels = (task.labels || []).map((l) => l.trim().toLowerCase()).filter(Boolean);

  const scoredCandidates: AssignmentSuggestion[] = eligible.map((candidate) => {
    const reasons: string[] = [];

    // 1. Skill Match Score (0.0 to 1.0)
    let skillScore = 0.7; // default neutral if task has no specific skill tags
    if (taskLabels.length > 0) {
      const matchingSkills: { name: string; level: number }[] = [];

      for (const skill of candidate.skills) {
        const skillNameLower = skill.name.toLowerCase();
        const matches = taskLabels.some(
          (label) =>
            label === skillNameLower ||
            skillNameLower.includes(label) ||
            label.includes(skillNameLower),
        );
        if (matches) {
          matchingSkills.push(skill);
        }
      }

      if (matchingSkills.length > 0) {
        // Average the proficiency of matching skills (level is 1..5)
        const avgLevel =
          matchingSkills.reduce((acc, curr) => acc + curr.level, 0) / matchingSkills.length;
        skillScore = avgLevel / 5;

        const bestSkill = matchingSkills.sort((a, b) => b.level - a.level)[0];
        reasons.push(`Skill match: ${bestSkill.name} (${bestSkill.level}/5)`);
      } else {
        skillScore = 0.15; // fallback low score if tags exist but none match
      }
    }

    // 2. Capacity Score (0.0 to 1.0)
    const openPoints = candidate.openEstimatePoints;
    const capacityScore = Math.max(0, Math.min(1, 1 - openPoints / capacityLimit));
    const isOverloaded = openPoints >= capacityLimit || candidate.availability === "OVERLOADED";

    if (isOverloaded) {
      reasons.push(`High workload: ${openPoints}/${capacityLimit} pts in progress`);
    } else {
      reasons.push(`Available capacity: ${openPoints}/${capacityLimit} pts`);
    }

    // 3. On-Time History Score (0.0 to 1.0)
    let historyScore = 0.75; // neutral value when no history
    if (candidate.completedTasksHistory && candidate.completedTasksHistory.length > 0) {
      const tasksWithDueDates = candidate.completedTasksHistory.filter((t) => t.dueDate != null);
      if (tasksWithDueDates.length > 0) {
        const onTimeCount = tasksWithDueDates.filter((t) => {
          if (!t.completedAt || !t.dueDate) return false;
          const completed = new Date(t.completedAt).getTime();
          const due = new Date(t.dueDate).getTime();
          return completed <= due;
        }).length;

        historyScore = onTimeCount / tasksWithDueDates.length;
        const ratePercent = Math.round(historyScore * 100);
        reasons.push(`${ratePercent}% on-time completion track record`);
      }
    }

    // Total weighted suitability score
    const rawSuitability =
      skillWeight * skillScore + capacityWeight * capacityScore + historyWeight * historyScore;

    const finalScore = Math.min(100, Math.max(0, Math.round(rawSuitability * 100)));

    return {
      membershipId: candidate.id,
      name: candidate.name,
      avatarUrl: candidate.avatarUrl,
      score: finalScore,
      reasons,
      capacityPoints: openPoints,
      capacityLimit,
      isOverloaded,
    };
  });

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  return scoredCandidates.slice(0, 3);
}
