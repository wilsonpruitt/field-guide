import Link from "next/link";
import { getConference } from "@/lib/conference";
import { linkBase } from "@/lib/host";
import { pick } from "@/lib/lang";
import { langFor } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";

const GROUPS: [string, string, string][] = [
  ["UNITING_TABLE", "Uniting Table", "Mesa de Unificación"],
  ["VISION_TEAM", "Vision Teams", "Equipos de Visión"],
  ["ADMINISTRATIVE_AGENCY", "Administrative Agencies", "Agencias Administrativas"],
  ["BOARD", "Boards", "Juntas"],
  ["REVIEW_COMMITTEE", "Review", "Revisión"],
];

import Community from "@/components/Community";

export default async function AgenciesIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), langFor(conference)]);
  const base = await linkBase(conf.slug);
  const all = await prisma.body.findMany({
    where: { conferenceId: conf.id },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <p className="eyebrow">{pick(lang, "Conference bodies", "Cuerpos de la conferencia")}</p>
      <h1>{pick(lang, "Agencies & vision teams", "Agencias y equipos de visión")}</h1>
      {GROUPS.map(([type, label, labelEs]) => {
        const items = all.filter((a) => a.type === type);
        return items.length ? (
          <section key={type}>
            <h2>{pick(lang, label, labelEs)}</h2>
            <ul className="bare">
              {items.map((a) => (
                <li key={a.id}>
                  <Link href={`${base}/agencies/${a.slug}`}>{a.name}</Link>
                  {a.bodRefs.length > 0 && <span className="pill">{a.bodRefs.join(", ")}</span>}
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      })}
      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PAGE" targetRef="agencies" />
    </>
  );
}
