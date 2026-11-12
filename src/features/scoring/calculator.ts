import { Priority } from "@prisma/client";
import { defaultScoringRules, ScoringRules, ScoreBreakdown } from "./schemas";

interface CalculateScoreParams {
  estimatePoints: number;
  priority: Priority;
  dueDate: Date | string | null;
  completedAt: Date | string;
  bounceCount?: number;
  rules?: ScoringRules;
}

/**
 * Calculates weighted score for a completed task according to Waypoint Specification Section 7.1.
 *
 * basePoints = estimatePoints × priorityMultiplier
 * onTime (completed on/before dueDate)  → points = basePoints × 1.2
 * late                                  → points = basePoints × 0.5
 * no dueDate                            → points = basePoints
 * task sent back from IN_REVIEW to IN_PROGRESS → -10% of basePoints per bounce (min 50% of basePoints)
 */
export function calculateTaskScore({
  estimatePoints,
  priority,
  dueDate,
  completedAt,
  bounceCount = 0,
  rules = defaultScoringRules,
}: CalculateScoreParams): ScoreBreakdown {
  const safeEstimate = Math.max(0, estimatePoints || 1);
  const priorityMult = rules.priorityMultipliers[priority] ?? 1.0;
  const basePoints = Math.round(safeEstimate * priorityMult * 100) / 100;

  const completedTime =
    typeof completedAt === "string" ? new Date(completedAt).getTime() : completedAt.getTime();

  let timingStatus: "ON_TIME" | "LATE" | "NO_DUE_DATE" = "NO_DUE_DATE";
  let timingMultiplier = rules.noDueDateMultiplier;

  if (dueDate) {
    const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
    // Normalize dueDate to end of day (23:59:59.999) if only a calendar date string was provided
    const dueTime = new Date(due).setHours(23, 59, 59, 999);

    if (completedTime <= dueTime) {
      timingStatus = "ON_TIME";
      timingMultiplier = rules.onTimeMultiplier;
    } else {
      timingStatus = "LATE";
      timingMultiplier = rules.lateMultiplier;
    }
  }

  const timedPoints = Math.round(basePoints * timingMultiplier * 100) / 100;

  // Review bounce deduction: 10% of base points per bounce, capped at 50%
  const effectiveBounceCount = Math.max(0, bounceCount);
  const rawBouncePercent = effectiveBounceCount * rules.bounceDeductionPercent;
  const cappedBouncePercent = Math.min(rules.maxBounceDeductionPercent, rawBouncePercent);
  const bounceDeductionPoints = Math.round(basePoints * cappedBouncePercent * 100) / 100;

  // Minimum floor: at least 50% of base points (or 0.5x base points)
  const minFloor = Math.round(basePoints * (1 - rules.maxBounceDeductionPercent) * 100) / 100;
  const rawFinalPoints = timedPoints - bounceDeductionPoints;
  const finalPoints = Math.max(minFloor, Math.round(rawFinalPoints * 100) / 100);

  // Generate transparent human-readable explanation
  const timingLabel =
    timingStatus === "ON_TIME"
      ? `On-time (+${Math.round((rules.onTimeMultiplier - 1) * 100)}% bonus = ×${rules.onTimeMultiplier})`
      : timingStatus === "LATE"
        ? `Late (${Math.round(rules.lateMultiplier * 100)}% penalty = ×${rules.lateMultiplier})`
        : `No due date (×${rules.noDueDateMultiplier})`;

  const bounceLabel =
    effectiveBounceCount > 0
      ? ` • ${effectiveBounceCount} review bounce(s) (-${Math.round(cappedBouncePercent * 100)}% / -${bounceDeductionPoints} pts)`
      : ` • 0 bounces`;

  const formulaExplanation = `Base: ${safeEstimate} pts × ${priority} (${priorityMult}x) = ${basePoints} pts • ${timingLabel}${bounceLabel} = ${finalPoints} final pts`;

  return {
    estimatePoints: safeEstimate,
    priority,
    priorityMultiplier: priorityMult,
    basePoints,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    completedAt: new Date(completedTime).toISOString(),
    timingStatus,
    timingMultiplier,
    timedPoints,
    bounceCount: effectiveBounceCount,
    bounceDeductionPercent: cappedBouncePercent,
    bounceDeductionPoints,
    finalPoints,
    formulaExplanation,
  };
}
