import { db } from "@/lib/db";

export const SYSTEM_BADGES = [
  {
    key: "STREAK_5",
    name: "Streak: 5 On-Time",
    description: "Completed 5 consecutive tasks on or before their due dates",
    icon: "flame",
  },
  {
    key: "BUG_SQUASHER",
    name: "Bug Squasher",
    description: "Successfully resolved 3 or more critical bug-fix tasks",
    icon: "shield-alert",
  },
  {
    key: "REVIEWER_CHOICE",
    name: "Reviewer's Choice",
    description: "Delivered tasks with zero review bounces across the monthly cycle",
    icon: "award",
  },
  {
    key: "WORKHORSE",
    name: "Workhorse",
    description: "Delivered the highest total story points in a monthly cycle",
    icon: "zap",
  },
] as const;

/**
 * Ensures system badge definitions are seeded in the database.
 */
export async function ensureSystemBadges() {
  for (const badge of SYSTEM_BADGES) {
    await db.badge.upsert({
      where: { key: badge.key },
      create: {
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      },
      update: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
      },
    });
  }
}

/**
 * Awards a badge to a member if they don't already have it.
 */
export async function awardBadgeToMember(membershipId: string, badgeKey: string) {
  const badge = await db.badge.findUnique({ where: { key: badgeKey } });
  if (!badge) return null;

  return db.memberBadge.upsert({
    where: {
      membershipId_badgeId: {
        membershipId,
        badgeId: badge.id,
      },
    },
    create: {
      membershipId,
      badgeId: badge.id,
    },
    update: {},
  });
}
