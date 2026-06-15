import Link from "next/link";
import { getConference } from "@/lib/conference";
import { prisma } from "@/lib/prisma";

const GROUPS: [string, string][] = [
  ["UNITING_TABLE", "Uniting Table"],
  ["VISION_TEAM", "Vision Teams"],
  ["ADMINISTRATIVE_AGENCY", "Administrative Agencies"],
  ["BOARD", "Boards"],
  ["REVIEW_COMMITTEE", "Review"],
];

export default async function AgenciesIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const all = await prisma.body.findMany({
    where: { conferenceId: conf.id },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <p className="eyebrow">Conference bodies</p>
      <h1>Agencies &amp; vision teams</h1>
      {GROUPS.map(([type, label]) => {
        const items = all.filter((a) => a.type === type);
        return items.length ? (
          <section key={type}>
            <h2>{label}</h2>
            <ul className="bare">
              {items.map((a) => (
                <li key={a.id}>
                  <Link href={`/${conf.slug}/agencies/${a.slug}`}>{a.name}</Link>
                  {a.bodRefs.length > 0 && <span className="pill">{a.bodRefs.join(", ")}</span>}
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      })}
    </>
  );
}
