import Link from "next/link";
import { getConference } from "@/lib/conference";
import { linkBase } from "@/lib/host";
import { pick, type Lang } from "@/lib/lang";
import { langFor } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";

const votesLabel = (lang: Lang, v?: string | null) =>
  v === "INFORMATION" ? pick(lang, "For Information Only", "Solo para información")
  : v === "ACTION" ? pick(lang, "For Conference Action", "Para acción de la conferencia")
  : v === "BOTH" ? pick(lang, "Action & Information", "Acción e información")
  : "";

import Community from "@/components/Community";

export default async function AgendaIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), langFor(conference)]);
  const base = await linkBase(conf.slug);
  const items = await prisma.agendaItem.findMany({
    where: { conferenceId: conf.id },
    orderBy: { order: "asc" },
  });

  return (
    <>
      <p className="eyebrow">{pick(lang, "What conference decides", "Lo que decide la conferencia")}</p>
      <h1>{pick(lang, "The agenda", "La agenda")}</h1>
      <p className="lede">
        {pick(
          lang,
          "The recurring items of business, in roughly the order conference takes them up. Each one explains what it is, who brings it, and whether it’s a vote.",
          "Los asuntos recurrentes, más o menos en el orden en que la conferencia los aborda. Cada uno explica qué es, quién lo presenta y si se vota.",
        )}
      </p>
      <ul className="bare">
        {items.map((it) => (
          <li key={it.id}>
            <Link href={`${base}/agenda/${it.slug}`}>{it.title}</Link>
            {it.votesOn && <span className="pill">{votesLabel(lang, it.votesOn)}</span>}
            <p className="muted" style={{ margin: ".25rem 0 0", fontSize: ".9rem" }}>{it.summary}</p>
          </li>
        ))}
      </ul>
      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PAGE" targetRef="agenda" />
    </>
  );
}
