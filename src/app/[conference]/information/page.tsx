import Link from "next/link";
import { getConference } from "@/lib/conference";
import { pick } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";

export default async function InformationIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), getLang()]);

  const latest = await prisma.infoReport.findFirst({
    where: { conferenceId: conf.id },
    orderBy: { year: "desc" },
    select: { year: true },
  });
  const year = latest?.year;
  const items = year
    ? await prisma.infoReport.findMany({ where: { conferenceId: conf.id, year }, orderBy: { order: "asc" } })
    : [];

  const groups: { category: string; items: typeof items }[] = [];
  for (const it of items) {
    const cat = it.category ?? "Other";
    const g = groups.find((x) => x.category === cat) ?? (groups.push({ category: cat, items: [] }), groups[groups.length - 1]);
    g.items.push(it);
  }

  const es = lang === "es";

  return (
    <>
      <p className="eyebrow">{es ? "Solo para información" : "For information"}{year ? ` · ${year}` : ""}</p>
      <h1>{es ? "Informes para conocimiento" : "Reports for information"}</h1>
      <p className="lede">
        {es
          ? "Los informes que la conferencia recibe sin votación — fácil que se pierdan en el volumen. Aquí están, explicados en lenguaje sencillo, con espacio para preguntar qué significan."
          : "The reports conference receives without a vote — easy to lose in the volume. Here they are, explained in plain language, with room to ask what they mean."}
      </p>

      {items.length === 0 ? (
        <p className="muted">{es ? "Aún no hay informes publicados." : "No reports posted yet."}</p>
      ) : (
        groups.map((g) => (
          <section key={g.category}>
            <h2>{g.category}</h2>
            <ul className="bare">
              {g.items.map((it) => (
                <li key={it.id}>
                  <Link href={`/${conf.slug}/information/${it.slug}`}>{pick(lang, it.title, it.titleEs)}</Link>
                  {it.number && <span className="pill">{it.number}</span>}
                  <p className="muted" style={{ margin: ".25rem 0 0", fontSize: ".9rem" }}>
                    {pick(lang, it.summary, it.summaryEs)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
