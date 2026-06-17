import { notFound } from "next/navigation";
import SpineContent from "@/components/SpineContent";
import { linkBase } from "@/lib/host";
import { getConference, getBodParas } from "@/lib/conference";
import { pick } from "@/lib/lang";
import { langFor } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";
import BodRefs from "@/components/BodRefs";
import HandbookCite from "@/components/HandbookCite";
import Community from "@/components/Community";
import EditProposal from "@/components/EditProposal";
import { getViewer, anchorsFor } from "@/lib/community";
import { extractSections } from "@/lib/sections";

export default async function ProcessDetail({
  params,
}: {
  params: Promise<{ conference: string; slug: string }>;
}) {
  const { conference, slug } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), langFor(conference)]);
  const base = await linkBase(conf.slug);

  const page = await prisma.processPage.findUnique({
    where: { conferenceId_slug: { conferenceId: conf.id, slug } },
  });
  if (!page) notFound();

  const paras = await getBodParas();
  const signedIn = !!(await getViewer(conf.id));
  const anchors = await anchorsFor(conf.id, "PROCESS", slug);
  const sections = extractSections(page.contentMd);

  return (
    <>
      <p className="eyebrow">{pick(lang, "How it works", "Cómo funciona")}</p>
      <h1>{pick(lang, page.title, page.titleEs)}</h1>
      <p>{pick(lang, page.summary, page.summaryEs)}</p>
      {page.bodRefs.length > 0 && (
        <p className="ref-line">
          <span className="ref-label">{pick(lang, "Book of Discipline", "Libro de Disciplina")}</span> <BodRefs refs={page.bodRefs} paras={paras} disciplineBase={`${base}/discipline`} lang={lang} />
        </p>
      )}

      {page.contentMd && (
        <SpineContent content={pick(lang, page.contentMd, page.contentMdEs)} anchors={anchors} lang={lang} />
      )}

      {page.sourcePage != null && (
        <HandbookCite source={conf.handbookLabel} page={page.sourcePage} handbookUrl={conf.handbookUrl} handbookLabel={conf.handbookLabel} lang={lang} />
      )}

      <EditProposal
        conference={conf.slug}
        lang={lang}
        targetType="PROCESS"
        targetRef={slug}
        signedIn={signedIn}
        fields={[
          { key: "summary", label: "Summary", current: page.summary },
          { key: "contentMd", label: "Full text", current: page.contentMd },
        ]}
      />

      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PROCESS" targetRef={slug} sections={sections} />
    </>
  );
}
