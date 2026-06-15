"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { ContributionType, TargetType, PerspectiveStance } from "@prisma/client";

export type SubmitResult = { ok: boolean; status?: "PUBLISHED" | "PENDING"; error?: string };

const TARGET_TYPES = ["BODY", "AGENDA", "PROCESS"] as const;
const TYPES = ["QUESTION", "COMMENT", "PERSPECTIVE", "ANSWER"] as const;
const STANCES = ["IN_FAVOR", "CONCERN", "CLARIFICATION", "ALTERNATIVE"] as const;

const SECTION: Record<TargetType, string> = { BODY: "agencies", AGENDA: "agenda", PROCESS: "process" };

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
