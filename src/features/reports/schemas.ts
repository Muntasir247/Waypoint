import { z } from "zod";

export const getReportsInputSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format")
    .optional(),
  projectId: z.string().optional(),
  membershipId: z.string().optional(),
});

export type GetReportsInput = z.infer<typeof getReportsInputSchema>;

export interface DeveloperReportItem {
  membershipId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  tasksCompleted: number;
  onTimeTasks: number;
  lateTasks: number;
  onTimeRate: number; // percentage 0-100
  totalPoints: number;
  reviewBounces: number;
  pointsPerTask: number;
  criticalTasksDone: number;
}

export interface ProjectReportItem {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number; // percentage 0-100
  totalPointsDelivered: number;
  openBugsCount: number;
  activeSprintsCount: number;
}

export interface MonthlyVelocityPoint {
  label: string;
  points: number;
  tasksCount: number;
}

export interface ReportSummary {
  month: string;
  generatedAt: string;
  totalDeliveredPoints: number;
  totalTasksCompleted: number;
  overallOnTimeRate: number;
  totalReviewBounces: number;
  openBugsCount: number;
  developerReports: DeveloperReportItem[];
  projectReports: ProjectReportItem[];
  velocityTrend: MonthlyVelocityPoint[];
}
