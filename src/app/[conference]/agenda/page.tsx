import Link from "next/link";
import { getConference, votesLabel } from "@/lib/conference";
import { prisma } from "@/lib/prisma";

export default async function AgendaIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const items = await prisma.agendaItem.findMany({
    where: { conferenceId: conf.id },
    orderBy: { order: "asc" },
  });

  return (
    <>
      <p className="eyebrow">What conference decides</p>
      <h1>The agenda</h1>
      <p className="lede">
        The recurring items of business, in roughly the order conference takes them up. Each one
        explains what it is, who brings it, and whether it&rsquo;s a vote.
      </p>
      <ul className="bare">
        {items.map((it) => (
          <li key={it.id}>
            <Link href={`/${conf.slug}/agenda/${it.slug}`}>{it.title}</Link>
            {it.votesOn && <span className="pill">{votesLabel(it.votesOn)}</span>}
            <p className="muted" style={{ margin: ".25rem 0 0", fontSize: ".9rem" }}>{it.summary}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
