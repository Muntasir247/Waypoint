import { z } from "zod";
import { Priority } from "@prisma/client";

export const defaultScoringRules = {
  priorityMultipliers: {
    LOW: 1.0,
    MEDIUM: 1.25,
    HIGH: 1.5,
    CRITICAL: 2.0,
  },
  onTimeMultiplier: 1.2,
  lateMultiplier: 0.5,
  noDueDateMultiplier: 1.0,
  bounceDeductionPercent: 0.1, // 10% per bounce
  maxBounceDeductionPercent: 0.5, // Min 50% of base points retained
  capacityLimit: 20,
};

export type ScoringRules = typeof defaultScoringRules;

export const updateScoringConfigSchema = z.object({
  enabled: z.boolean(),
  rules: z.object({
    priorityMultipliers: z.object({
      LOW: z.number().min(0.1).max(10),
      MEDIUM: z.number().min(0.1).max(10),
      HIGH: z.number().min(0.1).max(10),
      CRITICAL: z.number().min(0.1).max(10),
    }),
    onTimeMultiplier: z.number().min(1.0).max(5.0),
    lateMultiplier: z.number().min(0.0).max(1.0),
    noDueDateMultiplier: z.number().min(0.1).max(2.0),
    bounceDeductionPercent: z.number().min(0).max(0.5),
    maxBounceDeductionPercent: z.number().min(0).max(0.9),
    capacityLimit: z.number().min(5).max(100),
  }),
});

export type UpdateScoringConfigInput = z.infer<typeof updateScoringConfigSchema>;

export const recomputeMonthlyScoresSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format")
    .optional(),
});

export type RecomputeMonthlyScoresInput = z.infer<typeof recomputeMonthlyScoresSchema>;

export interface ScoreBreakdown {
  estimatePoints: number;
  priority: Priority;
  priorityMultiplier: number;
  basePoints: number;
  dueDate: string | null;
  completedAt: string;
  timingStatus: "ON_TIME" | "LATE" | "NO_DUE_DATE";
  timingMultiplier: number;
  timedPoints: number;
  bounceCount: number;
  bounceDeductionPercent: number;
  bounceDeductionPoints: number;
  finalPoints: number;
  formulaExplanation: string;
}

export interface BadgeItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  awardedAt?: string;
}

export interface LeaderboardMember {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  totalPoints: number;
  tasksCompleted: number;
  onTimeRate: number; // percentage 0-100
  rank: number;
  badges: BadgeItem[];
}
