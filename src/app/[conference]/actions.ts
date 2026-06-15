"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getViewer, endorseOp, flagOp } from "@/lib/community";
import { EDITABLE } from "@/lib/moderation";
import type { ContributionType, TargetType, PerspectiveStance } from "@prisma/client";

export type SubmitResult = { ok: boolean; status?: "PUBLISHED" | "PENDING"; error?: string };

const TARGET_TYPES = ["BODY", "AGENDA", "PROCESS"] as const;
const TYPES = ["QUESTION", "COMMENT", "PERSPECTIVE", "ANSWER"] as const;
const STANCES = ["IN_FAVOR", "CONCERN", "CLARIFICATION", "ALTERNATIVE"] as const;

const SECTION: Record<TargetType, string> = { BODY: "agencies", AGENDA: "agenda", PROCESS: "process", ACTION: "actions", INFO: "information" };

// Public submission of a question / note / perspective / answer against a spine
// element. Anonymous is allowed (always queued). Signed-in TL2+ auto-publishes;
// everyone else queues for moderation. Reachable by direct POST — validate here.
export async function submitContribution(
  _prev: SubmitResult | null,
  formData: FormData,
): Promise<SubmitResult> {
  // Honeypot: bots fill hidden fields. Pretend success, write nothing.
  if (String(formData.get("website") ?? "").trim() !== "") return { ok: true, status: "PENDING" };

  const conferenceSlug = String(formData.get("conferenceSlug") ?? "");
  const targetType = String(formData.get("targetType") ?? "") as TargetType;
  const targetRef = String(formData.get("targetRef") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ContributionType;
  const body = String(formData.get("body") ?? "").trim();
  const stanceRaw = String(formData.get("stance") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  const authorNameInput = String(formData.get("authorName") ?? "").trim().slice(0, 80);

  if (!TARGET_TYPES.includes(targetType as (typeof TARGET_TYPES)[number]) || !targetRef) {
    return { ok: false, error: "Missing target." };
  }
  if (!TYPES.includes(type as (typeof TYPES)[number])) return { ok: false, error: "Unknown kind." };
  if (body.length < 5) return { ok: false, error: "Please write a little more." };
  if (body.length > 4000) return { ok: false, error: "That's too long — please trim it." };

  const stance: PerspectiveStance | null =
    type === "PERSPECTIVE" && STANCES.includes(stanceRaw as (typeof STANCES)[number])
      ? (stanceRaw as PerspectiveStance)
      : null;

  const conference = await prisma.conference.findUnique({ where: { slug: conferenceSlug } });
  if (!conference) return { ok: false, error: "Unknown conference." };
  const conferenceId = conference.id;

  // Resolve author. Signed-in → ensure Profile + ConferenceMembership exist.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let authorId: string | null = null;
  let authorName: string | null = null;
  let autoPublish = false;

  if (user) {
    authorId = user.id;
    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: { email: user.email ?? null },
      create: { id: user.id, email: user.email ?? null, displayName: user.email?.split("@")[0] ?? "Member" },
    });
    const membership = await prisma.conferenceMembership.upsert({
      where: { conferenceId_profileId: { conferenceId, profileId: profile.id } },
      update: {},
      create: { conferenceId, profileId: profile.id, role: profile.defaultRole, trustLevel: 1 },
    });
    autoPublish = membership.trustLevel >= 2;
  } else {
    authorName = authorNameInput || null; // shown for anonymous; may be blank
  }

  // Answers must point at a real published parent in this conference.
  if (parentId) {
    const parent = await prisma.contribution.findFirst({
      where: { id: parentId, conferenceId, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!parent) return { ok: false, error: "That thread is no longer available." };
  }

  const status = autoPublish ? "PUBLISHED" : "PENDING";
  await prisma.contribution.create({
    data: {
      conferenceId,
      type,
      targetType,
      targetRef,
      parentId,
      authorId,
      authorName,
      body,
      stance,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  if (status === "PUBLISHED") {
    const base = targetRef.split("#")[0];
    revalidatePath(`/${conferenceSlug}/${SECTION[targetType]}/${base}`);
  }
  return { ok: true, status };
}

// Resolve conference + signed-in viewer for a reader interaction.
async function viewerFor(conferenceSlug: string) {
  const conference = await prisma.conference.findUnique({ where: { slug: conferenceSlug } });
  if (!conference) return { error: "Unknown conference." as const };
  const viewer = await getViewer(conference.id);
  if (!viewer) return { error: "Please sign in first." as const };
  return { conferenceId: conference.id, viewer };
}

function revalidateTarget(conferenceSlug: string, targetType: TargetType, targetRef: string) {
  revalidatePath(`/${conferenceSlug}/${SECTION[targetType]}/${targetRef.split("#")[0]}`);
}

export async function endorseContribution(
  conferenceSlug: string,
  contributionId: string,
  targetType: TargetType,
  targetRef: string,
): Promise<SubmitResult> {
  const ctx = await viewerFor(conferenceSlug);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  const res = await endorseOp(contributionId, ctx.conferenceId, ctx.viewer.userId);
  if (!res.ok) return { ok: false, error: res.error };
  revalidateTarget(conferenceSlug, targetType, targetRef);
  return { ok: true };
}

// Propose an edit to a spine text field. Signed-in only (edits to the
// canonical text carry a name) and ALWAYS queued for a steward to apply.
export async function proposeEdit(
  conferenceSlug: string,
  targetType: TargetType,
  targetRef: string,
  field: string,
  proposedText: string,
  rationale: string,
): Promise<SubmitResult> {
  const ctx = await viewerFor(conferenceSlug);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  if (!EDITABLE[targetType]?.includes(field)) return { ok: false, error: "That field can't be edited." };
  const text = proposedText.trim();
  if (text.length < 3) return { ok: false, error: "Please write the proposed text." };
  if (text.length > 8000) return { ok: false, error: "That's too long." };

  await prisma.contribution.create({
    data: {
      conferenceId: ctx.conferenceId,
      type: "EDIT_PROPOSAL",
      targetType,
      targetRef,
      authorId: ctx.viewer.userId,
      body: rationale.trim().slice(0, 1000) || `Proposed edit to “${field}”.`,
      proposedField: field,
      proposedText: text,
      status: "PENDING",
    },
  });
  revalidatePath(`/${conferenceSlug}/moderate`);
  return { ok: true, status: "PENDING" };
}

export async function flagContribution(
  conferenceSlug: string,
  contributionId: string,
  targetType: TargetType,
  targetRef: string,
  reason: string,
): Promise<SubmitResult> {
  const ctx = await viewerFor(conferenceSlug);
  if ("error" in ctx) return { ok: false, error: ctx.error };
  if (reason.trim().length < 3) return { ok: false, error: "Add a brief reason." };
  const res = await flagOp(contributionId, ctx.conferenceId, ctx.viewer.userId, reason.trim());
  if (!res.ok) return { ok: false, error: res.error };
  revalidateTarget(conferenceSlug, targetType, targetRef);
  return { ok: true };
}
