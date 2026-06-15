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

export default async function ProcessDetail({
  params,
}: {
  params: Promise<{ conference: string; slug: string }>;
}) {
  const { conference, slug } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), getLang()]);

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
      <h1>{page.title}</h1>
      <p>{page.summary}</p>
      {page.bodRefs.length > 0 && (
        <p className="ref-line">
          <span className="ref-label">{pick(lang, "Book of Discipline", "Libro de Disciplina")}</span> <BodRefs refs={page.bodRefs} paras={paras} disciplineBase={`/${conf.slug}/discipline`} lang={lang} />
        </p>
      )}

      {page.contentMd && (
        <SpineContent content={page.contentMd} anchors={anchors} lang={lang} />
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
