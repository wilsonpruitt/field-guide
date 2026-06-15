import Link from "next/link";
import { getConference } from "@/lib/conference";
import { prisma } from "@/lib/prisma";

export default async function ActionsIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);

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
      <p className="eyebrow">For conference action{year ? ` · ${year}` : ""}</p>
      <h1>Up for a vote</h1>
      <p className="lede">
        The reports and resolutions conference is asked to approve this year, from the pre-conference
        report. Read what each one does, then weigh in — say whether you&rsquo;re for it, raise a
        concern, ask for a clarification, or offer an alternative.
      </p>

      {items.length === 0 ? (
        <p className="muted">No action items posted yet for this year.</p>
      ) : (
        groups.map((g) => (
          <section key={g.category}>
            <h2>{g.category}</h2>
            <ul className="bare">
              {g.items.map((it) => (
                <li key={it.id}>
                  <Link href={`/${conf.slug}/actions/${it.slug}`}>{it.title}</Link>
                  {it.number && <span className="pill">{it.number}</span>}
                  <p className="muted" style={{ margin: ".25rem 0 0", fontSize: ".9rem" }}>{it.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
