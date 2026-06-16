import Link from "next/link";
import { getConference } from "@/lib/conference";
import { linkBase } from "@/lib/host";
import { pick } from "@/lib/lang";
import { langFor } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";

import Community from "@/components/Community";

export default async function ActionsIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), langFor(conference)]);
  const base = await linkBase(conf.slug);

  const latest = await prisma.actionItem.findFirst({
    where: { conferenceId: conf.id },
    orderBy: { year: "desc" },
    select: { year: true },
  });
  const year = latest?.year;
  const items = year
    ? await prisma.actionItem.findMany({
        where: { conferenceId: conf.id, year },
        orderBy: { order: "asc" },
      })
    : [];

  // Group by category, preserving first-seen order.
  const groups: { category: string; items: typeof items }[] = [];
  for (const it of items) {
    const cat = it.category ?? "Other";
    const g = groups.find((x) => x.category === cat) ?? (groups.push({ category: cat, items: [] }), groups[groups.length - 1]);
    g.items.push(it);
  }

  return (
    <>
      <p className="eyebrow">{pick(lang, "For conference action", "Para acción de la conferencia")}{year ? ` · ${year}` : ""}</p>
      <h1>{pick(lang, "Up for a vote", "Para votación")}</h1>
      <p className="lede">
        {pick(
          lang,
          "The reports and resolutions conference is asked to approve this year, from the pre-conference report. Read what each one does, then weigh in — say whether you’re for it, raise a concern, ask for a clarification, or offer an alternative.",
          "Los informes y resoluciones que se pide a la conferencia aprobar este año, del informe previo a la conferencia. Lee qué hace cada uno y luego opina — di si lo apoyas, plantea una inquietud, pide una aclaración u ofrece una alternativa.",
        )}
      </p>

      {items.length === 0 ? (
        <p className="muted">{pick(lang, "No action items posted yet for this year.", "Aún no hay puntos de acción publicados para este año.")}</p>
      ) : (
        groups.map((g) => (
          <section key={g.category}>
            <h2>{g.category}</h2>
            <ul className="bare">
              {g.items.map((it) => (
                <li key={it.id}>
                  <Link href={`${base}/actions/${it.slug}`}>{it.title}</Link>
                  {it.number && <span className="pill">{it.number}</span>}
                  <p className="muted" style={{ margin: ".25rem 0 0", fontSize: ".9rem" }}>{it.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PAGE" targetRef="actions" />
    </>
  );
}
