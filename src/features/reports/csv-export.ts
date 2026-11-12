import type { ReportSummary } from "./schemas";

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate RFC-4180 compliant CSV string from Monthly Report summary.
 */
export function generateReportCSV(summary: ReportSummary): string {
  const lines: string[] = [];

  // 1. Report Header
  lines.push("WAYPOINT ENGINEERING MONTHLY REPORT");
  lines.push(`Month,${escapeCSV(summary.month)}`);
  lines.push(`Generated At,${escapeCSV(new Date().toISOString())}`);
  lines.push("");

  // 2. High-Level KPIs
  lines.push("EXECUTIVE SUMMARY");
  lines.push("Metric,Value");
  lines.push(`Total Delivered Points,${summary.totalDeliveredPoints}`);
  lines.push(`Total Tasks Completed,${summary.totalTasksCompleted}`);
  lines.push(`Overall On-Time Rate,${summary.overallOnTimeRate}%`);
  lines.push(`Review Bounces,${summary.totalReviewBounces}`);
  lines.push(`Open Bugs Across Workspace,${summary.openBugsCount}`);
  lines.push("");

  // 3. Developer Breakdown
  lines.push("DEVELOPER PERFORMANCE BREAKDOWN");
  lines.push(
    "Name,Email,Role,Delivered Points,Tasks Completed,On-Time Rate,Late Tasks,Critical Tasks",
  );
  for (const dev of summary.developerReports) {
    lines.push(
      [
        escapeCSV(dev.name),
        escapeCSV(dev.email),
        escapeCSV(dev.role),
        escapeCSV(dev.totalPoints),
        escapeCSV(dev.tasksCompleted),
        escapeCSV(`${dev.onTimeRate}%`),
        escapeCSV(dev.lateTasks),
        escapeCSV(dev.criticalTasksDone),
      ].join(","),
    );
  }
  lines.push("");

  // 4. Project Health Breakdown
  lines.push("PROJECT HEALTH BREAKDOWN");
  lines.push("Project Name,Total Tasks,Completed Tasks,Completion Rate,Delivered Points,Open Bugs");
  for (const proj of summary.projectReports) {
    lines.push(
      [
        escapeCSV(proj.projectName),
        escapeCSV(proj.totalTasks),
        escapeCSV(proj.completedTasks),
        escapeCSV(`${proj.completionRate}%`),
        escapeCSV(proj.totalPointsDelivered),
        escapeCSV(proj.openBugsCount),
      ].join(","),
    );
  }

  return lines.join("\r\n");
}

/**
 * Trigger client browser download of CSV file.
 */
export function downloadReportCSV(summary: ReportSummary) {
  const csvContent = generateReportCSV(summary);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `waypoint-report-${summary.month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
