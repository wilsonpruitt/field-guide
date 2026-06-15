import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { BodPara } from "@/components/BodRefs";

/** Resolve a conference by its URL slug, or 404. Cached per request via React. */
export async function getConference(slug: string) {
  const conference = await prisma.conference.findUnique({ where: { slug } });
  if (!conference) notFound();
  return conference;
}

/** number → entry map for BodRefs popovers (denomination-wide, shared). */
export async function getBodParas(): Promise<Record<string, BodPara>> {
  const paras = await prisma.bodParagraph.findMany();
  return Object.fromEntries(
    paras.map((p) => [String(p.number), { number: p.number, title: p.title, excerpt: p.excerpt, source: p.source }]),
  );
}

export const votesLabel = (v?: string | null) =>
  v === "INFORMATION" ? "For Information Only"
  : v === "ACTION" ? "For Conference Action"
  : v === "BOTH" ? "Action & Information"
  : "";
