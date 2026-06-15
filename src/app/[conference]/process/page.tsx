import Link from "next/link";
import { getConference } from "@/lib/conference";
import { pick } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";

import Community from "@/components/Community";

export default async function ProcessIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), getLang()]);
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
            <Link href={`/${conf.slug}/process/${p.slug}`}>{p.title}</Link>
            <p className="muted" style={{ margin: ".25rem 0 0", fontSize: ".9rem" }}>{p.summary}</p>
          </li>
        ))}
      </ul>
      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PAGE" targetRef="process" />
    </>
  );
}
