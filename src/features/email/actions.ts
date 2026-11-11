"use server";

import { db } from "@/lib/db";

export async function getMockEmails() {
  const emails = await db.mockEmail.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return emails;
}

export async function clearMockEmails() {
  await db.mockEmail.deleteMany({});
  return { success: true };
}
