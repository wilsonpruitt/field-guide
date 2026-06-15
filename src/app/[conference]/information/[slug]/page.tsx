import Link from "next/link";
import { notFound } from "next/navigation";
import SpineContent from "@/components/SpineContent";
import { getConference, getBodParas } from "@/lib/conference";
import { pick } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";
import BodRefs from "@/components/BodRefs";
import Community from "@/components/Community";
import EditProposal from "@/components/EditProposal";
import { getViewer, anchorsFor } from "@/lib/community";
import { extractSections } from "@/lib/sections";

export default async function InfoDetail({
  params,
}: {
  params: Promise<{ conference: string; slug: string }>;
}) {
  const { conference, slug } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), getLang()]);

  const item = await prisma.infoReport.findFirst({
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

  const es = lang === "es";
  const content = pick(lang, item.contentMd, item.contentMdEs);
  const signedIn = !!(await getViewer(conf.id));
  const anchors = await anchorsFor(conf.id, "INFO", slug);
  const sections = extractSections(content || "");

  return (
    <>
      <p className="eyebrow">
        {es ? "Solo para información" : "For information"}{item.category ? ` · ${item.category}` : ""}
      </p>
      <h1>{pick(lang, item.title, item.titleEs)}</h1>
      {item.number && <p className="title-italic">{item.number} · {item.year}</p>}
      <p>{pick(lang, item.summary, item.summaryEs)}</p>

      {agency && (
        <p><span className="pill"><Link href={`/${conf.slug}/agencies/${agency.slug}`}>{agency.name}</Link></span></p>
      )}
      {item.bodRefs.length > 0 && (
        <p className="ref-line">
          <span className="ref-label">{es ? "Libro de Disciplina" : "Book of Discipline"}</span>{" "}
          <BodRefs refs={item.bodRefs} paras={paras} disciplineBase={`/${conf.slug}/discipline`} lang={lang} />
        </p>
      )}

      {content && (
        <SpineContent content={content} anchors={anchors} lang={lang} />
      )}
      {item.source && <p className="py-source">{es ? "Fuente" : "Source"}: {item.source}</p>}

      <EditProposal
        conference={conf.slug}
        lang={lang}
        targetType="INFO"
        targetRef={slug}
        signedIn={signedIn}
        fields={[
          { key: "summary", label: "Summary (English)", current: item.summary },
          { key: "contentMd", label: "Full text (English)", current: item.contentMd },
        ]}
      />

      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="INFO" targetRef={slug} sections={sections} />
    </>
  );
}
