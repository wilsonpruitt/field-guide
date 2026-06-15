import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { TargetType } from "@prisma/client";

// ── Viewer: who's looking, and what they may do in THIS conference ──
// Trust tiers (per-conference): 0 visitor, 1 member, 2 regular (auto-publish),
// 3 editor, 4 steward. Anonymous (no user) always queues.
export type Viewer = {
  userId: string;
  displayName: string;
  trustLevel: number;
  autoPublish: boolean; // TL2+ → contributions skip the queue
};

export async function getViewer(conferenceId: string): Promise<Viewer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, membership] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id } }),
    prisma.conferenceMembership.findUnique({
      where: { conferenceId_profileId: { conferenceId, profileId: user.id } },
    }),
  ]);
  const trustLevel = membership?.trustLevel ?? 1;
  return {
    userId: user.id,
    displayName: profile?.displayName ?? user.email?.split("@")[0] ?? "Member",
    trustLevel,
    autoPublish: trustLevel >= 2,
  };
}

// A published contribution + its author label and endorsement count, shaped for display.
export type PublicContribution = {
  id: string;
  type: "QUESTION" | "ANSWER" | "COMMENT" | "PERSPECTIVE" | "EDIT_PROPOSAL";
  body: string;
  stance: "IN_FAVOR" | "CONCERN" | "CLARIFICATION" | "ALTERNATIVE" | null;
  authorLabel: string;
  createdAt: Date;
  endorsements: number;
  anchor: string | null; // sub-anchor from "slug#anchor", if the note targets a section
  replies: PublicContribution[];
};

// `ref` matches the target slug exactly, or as a "slug#anchor" prefix.
export async function publishedFor(conferenceId: string, targetType: TargetType, slug: string) {
  const rows = await prisma.contribution.findMany({
    where: {
      conferenceId,
      targetType,
      status: "PUBLISHED",
      OR: [{ targetRef: slug }, { targetRef: { startsWith: `${slug}#` } }],
    },
    orderBy: { createdAt: "asc" },
    include: { author: true, _count: { select: { endorsements: true } } },
  });

  const shape = (r: (typeof rows)[number]): PublicContribution => ({
    id: r.id,
    type: r.type,
    body: r.body,
    stance: r.stance,
    authorLabel: r.author?.displayName ?? r.authorName ?? "Anonymous",
    createdAt: r.createdAt,
    endorsements: r._count.endorsements,
    anchor: r.targetRef.includes("#") ? r.targetRef.split("#")[1] : null,
    replies: [],
  });

  const byId = new Map(rows.map((r) => [r.id, shape(r)]));
  const top: PublicContribution[] = [];
  for (const r of rows) {
    const node = byId.get(r.id)!;
    if (r.parentId && byId.has(r.parentId)) byId.get(r.parentId)!.replies.push(node);
    else top.push(node);
  }

  return {
    questions: top.filter((c) => c.type === "QUESTION"),
    notes: top.filter((c) => c.type === "COMMENT" || c.type === "PERSPECTIVE"),
  };
}

// Published notes grouped by their sub-anchor, for inline markers in the
// content. anchorSlug → { count, firstId } (firstId = oldest note, scroll target).
export async function anchorsFor(conferenceId: string, targetType: TargetType, slug: string) {
  const rows = await prisma.contribution.findMany({
    where: {
      conferenceId,
      targetType,
      status: "PUBLISHED",
      type: { in: ["COMMENT", "PERSPECTIVE", "QUESTION"] },
      targetRef: { startsWith: `${slug}#` },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, targetRef: true },
  });
  const map: Record<string, { count: number; firstId: string }> = {};
  for (const r of rows) {
    const anchor = r.targetRef.split("#")[1];
    if (!anchor) continue;
    if (map[anchor]) map[anchor].count += 1;
    else map[anchor] = { count: 1, firstId: r.id };
  }
  return map;
}

// ── Reader interactions on published contributions (signed-in) ──

/** Endorse a published contribution as helpful. Idempotent per person; the
 *  first endorsement credits the author's reputation. */
export async function endorseOp(contributionId: string, conferenceId: string, profileId: string) {
  const c = await prisma.contribution.findFirst({
    where: { id: contributionId, conferenceId, status: "PUBLISHED" },
    select: { id: true, authorId: true },
  });
  if (!c) return { ok: false as const, error: "Not found." };
  const existing = await prisma.endorsement.findUnique({
    where: { contributionId_profileId_kind: { contributionId: c.id, profileId, kind: "helpful" } },
  });
  if (existing) return { ok: true as const, already: true };

  await prisma.endorsement.create({ data: { contributionId: c.id, profileId, kind: "helpful" } });
  // Credit the author (not for self-endorsement, not for anonymous authors).
  if (c.authorId && c.authorId !== profileId) {
    const { awardReputation } = await import("@/lib/moderation");
    await awardReputation(conferenceId, c.authorId, 1, "endorsed as helpful", c.id);
  }
  return { ok: true as const };
}

/** Flag a published contribution for steward review. */
export async function flagOp(contributionId: string, conferenceId: string, profileId: string, reason: string) {
  const c = await prisma.contribution.findFirst({
    where: { id: contributionId, conferenceId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!c) return { ok: false as const, error: "Not found." };
  await prisma.flag.create({ data: { contributionId: c.id, profileId, reason: reason.slice(0, 300) } });
  return { ok: true as const };
}
