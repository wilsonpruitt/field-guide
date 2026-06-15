"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/community";
import { TL, reviewContributionOp, setTrustLevelOp, resolveFlagsOp, applyEditOp } from "@/lib/moderation";
import type { TargetType } from "@prisma/client";

const SECTION: Record<TargetType, string> = { BODY: "agencies", AGENDA: "agenda", PROCESS: "process", ACTION: "actions", INFO: "information" };

type Result = { ok: boolean; error?: string };

// Resolve the conference and confirm the caller has at least `minLevel` here.
async function authorize(conferenceSlug: string, minLevel: number) {
  const conference = await prisma.conference.findUnique({ where: { slug: conferenceSlug } });
  if (!conference) return { error: "Unknown conference." as const };
  const viewer = await getViewer(conference.id);
  if (!viewer || viewer.trustLevel < minLevel) return { error: "Not authorized." as const };
  return { conferenceId: conference.id, viewer };
}

export async function reviewContribution(
  conferenceSlug: string,
  contributionId: string,
  decision: "PUBLISH" | "REJECT",
): Promise<Result> {
  const auth = await authorize(conferenceSlug, TL.EDITOR);
  if ("error" in auth) return { ok: false, error: auth.error };

  const target = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { targetType: true, targetRef: true },
  });
  const res = await reviewContributionOp(contributionId, auth.conferenceId, decision, auth.viewer.userId);
  if (!res.ok) return res;

  revalidatePath(`/${conferenceSlug}/moderate`);
  if (res.status === "PUBLISHED" && target) {
    revalidatePath(`/${conferenceSlug}/${SECTION[target.targetType]}/${target.targetRef.split("#")[0]}`);
  }
  return { ok: true };
}

export async function resolveFlags(
  conferenceSlug: string,
  contributionId: string,
  unpublish: boolean,
): Promise<Result> {
  const auth = await authorize(conferenceSlug, TL.EDITOR);
  if ("error" in auth) return { ok: false, error: auth.error };

  const target = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { targetType: true, targetRef: true },
  });
  const res = await resolveFlagsOp(contributionId, auth.conferenceId, unpublish);
  if (!res.ok) return res;

  revalidatePath(`/${conferenceSlug}/moderate`);
  if (target) revalidatePath(`/${conferenceSlug}/${SECTION[target.targetType]}/${target.targetRef.split("#")[0]}`);
  return { ok: true };
}

export async function reviewEdit(
  conferenceSlug: string,
  contributionId: string,
  decision: "APPLY" | "REJECT",
): Promise<Result> {
  const auth = await authorize(conferenceSlug, TL.EDITOR);
  if ("error" in auth) return { ok: false, error: auth.error };

  const target = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { targetType: true, targetRef: true },
  });

  if (decision === "REJECT") {
    await prisma.contribution.updateMany({
      where: { id: contributionId, conferenceId: auth.conferenceId, status: "PENDING" },
      data: { status: "REJECTED", reviewedById: auth.viewer.userId },
    });
  } else {
    const res = await applyEditOp(contributionId, auth.conferenceId, auth.viewer.userId);
    if (!res.ok) return res;
  }

  revalidatePath(`/${conferenceSlug}/moderate`);
  if (decision === "APPLY" && target) {
    revalidatePath(`/${conferenceSlug}/${SECTION[target.targetType]}/${target.targetRef.split("#")[0]}`);
  }
  return { ok: true };
}

export async function setTrustLevel(
  conferenceSlug: string,
  membershipId: string,
  level: number,
): Promise<Result> {
  const auth = await authorize(conferenceSlug, TL.STEWARD);
  if ("error" in auth) return { ok: false, error: auth.error };

  const res = await setTrustLevelOp(membershipId, auth.conferenceId, level);
  if (!res.ok) return res;
  revalidatePath(`/${conferenceSlug}/moderate`);
  return { ok: true };
}
