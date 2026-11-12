import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWorkspaceDigestsAction } from "@/features/digests/actions";

export const instant = false;

/**
 * Vercel Cron job endpoint for dispatching daily/weekly simulated email digests.
 * Protected by CRON_SECRET authorization header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workspaces = await db.workspace.findMany({ select: { id: true, name: true } });
    let totalDigestsSent = 0;
    const processedWorkspaces: string[] = [];

    for (const workspace of workspaces) {
      const result = await sendWorkspaceDigestsAction(workspace.id);
      totalDigestsSent += result.sentCount;
      processedWorkspaces.push(workspace.name);
    }

    return NextResponse.json({
      success: true,
      totalDigestsSent,
      processedWorkspaces,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron email digest execution error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
