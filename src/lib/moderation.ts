import { prisma } from "@/lib/prisma";

// Trust thresholds. TL3 editor can review the queue; TL4 steward can also
// appoint trust. TL1→TL2 is earned automatically (see REP_TO_REGULAR).
export const TL = { MEMBER: 1, REGULAR: 2, EDITOR: 3, STEWARD: 4 } as const;
export const REP_TO_REGULAR = 5; // endorsements needed to auto-promote TL1 → TL2

export const TRUST_LABEL: Record<number, string> = {
  0: "Visitor", 1: "Member", 2: "Regular", 3: "Editor", 4: "Steward",
};

// ── Queue contents (no auth here; callers gate first) ──

export async function pendingQueue(conferenceId: string) {
  return prisma.contribution.findMany({
    where: { conferenceId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { author: true },
  });
}

export async function flaggedPublished(conferenceId: string) {
  return prisma.contribution.findMany({
    where: { conferenceId, status: "PUBLISHED", flags: { some: { resolved: false } } },
    orderBy: { createdAt: "asc" },
    include: {
      author: true,
      flags: { where: { resolved: false }, include: { profile: true } },
    },
  });
}

export async function conferenceMembers(conferenceId: string) {
  return prisma.conferenceMembership.findMany({
    where: { conferenceId },
    orderBy: [{ trustLevel: "desc" }, { createdAt: "asc" }],
    include: { profile: true, _count: { select: { reputationEvents: true } } },
  });
}

// ── DB transitions (pure ops; server actions wrap these with authorization) ──

/** Publish or reject a queued contribution. Publishing awards the author a
 *  little reputation and may auto-promote them to Regular. */
export async function reviewContributionOp(
  contributionId: string,
  conferenceId: string,
  decision: "PUBLISH" | "REJECT",
  reviewerProfileId: string,
) {
  const c = await prisma.contribution.findFirst({
    where: { id: contributionId, conferenceId, status: "PENDING" },
  });
  if (!c) return { ok: false as const, error: "Not found or already reviewed." };

  if (decision === "REJECT") {
    await prisma.contribution.update({
      where: { id: c.id },
      data: { status: "REJECTED", reviewedById: reviewerProfileId },
    });
    return { ok: true as const, status: "REJECTED" as const };
  }

  await prisma.contribution.update({
    where: { id: c.id },
    data: { status: "PUBLISHED", reviewedById: reviewerProfileId, publishedAt: new Date() },
  });
  // Reward the author (if not anonymous) and re-check their tier.
  if (c.authorId) await awardReputation(conferenceId, c.authorId, 2, "contribution published", c.id);
  return { ok: true as const, status: "PUBLISHED" as const };
}

/** Add reputation to a member and auto-promote TL1 → TL2 once they clear the bar. */
export async function awardReputation(
  conferenceId: string,
  profileId: string,
  delta: number,
  reason: string,
  contributionId?: string,
) {
  const membership = await prisma.conferenceMembership.findUnique({
    where: { conferenceId_profileId: { conferenceId, profileId } },
  });
  if (!membership) return;
  await prisma.reputationEvent.create({
    data: { membershipId: membership.id, delta, reason, contributionId: contributionId ?? null },
  });
  const reputation = membership.reputation + delta;
  const trustLevel =
    membership.trustLevel === TL.MEMBER && reputation >= REP_TO_REGULAR ? TL.REGULAR : membership.trustLevel;
  await prisma.conferenceMembership.update({
    where: { id: membership.id },
    data: { reputation, trustLevel },
  });
}

/** Steward sets a member's trust level (appoint Editor/Steward, or adjust). */
export async function setTrustLevelOp(membershipId: string, conferenceId: string, level: number) {
  if (level < 0 || level > 4) return { ok: false as const, error: "Invalid level." };
  const membership = await prisma.conferenceMembership.findFirst({ where: { id: membershipId, conferenceId } });
  if (!membership) return { ok: false as const, error: "Member not found." };
  await prisma.conferenceMembership.update({ where: { id: membership.id }, data: { trustLevel: level } });
  return { ok: true as const, level };
}

/** Resolve all open flags on a contribution; optionally unpublish it. */
export async function resolveFlagsOp(contributionId: string, conferenceId: string, unpublish: boolean) {
  const c = await prisma.contribution.findFirst({ where: { id: contributionId, conferenceId } });
  if (!c) return { ok: false as const, error: "Not found." };
  await prisma.flag.updateMany({ where: { contributionId: c.id, resolved: false }, data: { resolved: true } });
  if (unpublish) await prisma.contribution.update({ where: { id: c.id }, data: { status: "REJECTED" } });
  return { ok: true as const, unpublished: unpublish };
}
