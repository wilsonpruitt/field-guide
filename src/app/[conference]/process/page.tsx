import Link from "next/link";
import { getConference } from "@/lib/conference";
import { linkBase } from "@/lib/host";
import { pick } from "@/lib/lang";
import { langFor } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";

import Community from "@/components/Community";

export default async function ProcessIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), langFor(conference)]);
  const base = await linkBase(conf.slug);
  const pages = await prisma.processPage.findMany({
    where: { conferenceId: conf.id },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });

  return (
    <>
      <p className="eyebrow">{pick(lang, "How conference works", "Cómo funciona la conferencia")}</p>
      <h1>{pick(lang, "The mechanics", "La mecánica")}</h1>
      <p className="lede">
        {pick(
          lang,
          "Not a specific item of business — the standing machinery: who’s a member and who votes, the consent agenda, resolutions, and motions from the floor.",
          "No un asunto específico — la maquinaria permanente: quién es miembro y quién vota, la agenda de consentimiento, las resoluciones y las mociones desde el pleno.",
        )}
      </p>
      <ul className="bare">
        {pages.map((p) => (
          <li key={p.id}>
            <Link href={`${base}/process/${p.slug}`}>{pick(lang, p.title, p.titleEs)}</Link>
            <p className="muted" style={{ margin: ".25rem 0 0", fontSize: ".9rem" }}>{pick(lang, p.summary, p.summaryEs)}</p>
          </li>
        ))}
      </ul>
      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PAGE" targetRef="process" />
    </>
  );
}
