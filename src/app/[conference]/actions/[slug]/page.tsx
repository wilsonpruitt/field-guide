import Link from "next/link";
import { notFound } from "next/navigation";
import SpineContent from "@/components/SpineContent";
import { getConference, getBodParas } from "@/lib/conference";
import { pick } from "@/lib/lang";
import { langFor } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";
import BodRefs from "@/components/BodRefs";
import ActionPerspectives from "@/components/ActionPerspectives";
import EditProposal from "@/components/EditProposal";
import { getViewer, anchorsFor } from "@/lib/community";
import { extractSections } from "@/lib/sections";

export default async function ActionDetail({
  params,
}: {
  params: Promise<{ conference: string; slug: string }>;
}) {
  const { conference, slug } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), langFor(conference)]);

  const item = await prisma.actionItem.findFirst({
    where: { conferenceId: conf.id, slug },
    orderBy: { year: "desc" },
  });
  if (!item) notFound();

  const [paras, agency] = await Promise.all([
    getBodParas(),
    item.agencySlug
      ? prisma.body.findUnique({ where: { conferenceId_slug: { conferenceId: conf.id, slug: item.agencySlug } } })
      : Promise.resolve(null),
  ]);
  const signedIn = !!(await getViewer(conf.id));
  const anchors = await anchorsFor(conf.id, "ACTION", slug);
  const sections = extractSections(pick(lang, item.contentMd, item.contentMdEs) || "");

  return (
    <>
      <p className="eyebrow">{pick(lang, "For conference action", "Para acción de la conferencia")}{item.category ? ` · ${item.category}` : ""}</p>
      <h1>{pick(lang, item.title, item.titleEs)}</h1>
      {item.number && <p className="title-italic">{item.number} · {item.year}</p>}
      <p>{pick(lang, item.summary, item.summaryEs)}</p>

      {agency && (
        <p><span className="pill"><Link href={`/${conf.slug}/agencies/${agency.slug}`}>{agency.name}</Link></span></p>
      )}
      {item.bodRefs.length > 0 && (
        <p className="ref-line">
          <span className="ref-label">{pick(lang, "Book of Discipline", "Libro de Disciplina")}</span>{" "}
          <BodRefs refs={item.bodRefs} paras={paras} disciplineBase={`/${conf.slug}/discipline`} lang={lang} />
        </p>
      )}

      {pick(lang, item.contentMd, item.contentMdEs) && (
        <SpineContent content={pick(lang, item.contentMd, item.contentMdEs)} anchors={anchors} lang={lang} />
      )}
      {item.source && <p className="py-source">{pick(lang, "Source", "Fuente")}: {item.source}</p>}

      <EditProposal
        conference={conf.slug}
        lang={lang}
        targetType="ACTION"
        targetRef={slug}
        signedIn={signedIn}
        fields={[
          { key: "summary", label: "Summary (English)", current: item.summary },
          { key: "contentMd", label: "Full text (English)", current: item.contentMd },
        ]}
      />

      <ActionPerspectives conferenceId={conf.id} conferenceSlug={conf.slug} slug={slug} sections={sections} />
    </>
  );
}
