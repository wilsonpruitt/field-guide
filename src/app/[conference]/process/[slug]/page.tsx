import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getConference, getBodParas } from "@/lib/conference";
import { prisma } from "@/lib/prisma";
import BodRefs from "@/components/BodRefs";
import Community from "@/components/Community";
import EditProposal from "@/components/EditProposal";
import { getViewer } from "@/lib/community";

export default async function ProcessDetail({
  params,
}: {
  params: Promise<{ conference: string; slug: string }>;
}) {
  const { conference, slug } = await params;
  const conf = await getConference(conference);

  const page = await prisma.processPage.findUnique({
    where: { conferenceId_slug: { conferenceId: conf.id, slug } },
  });
  if (!page) notFound();

  const paras = await getBodParas();
  const signedIn = !!(await getViewer(conf.id));

  return (
    <>
      <p className="eyebrow">How it works</p>
      <h1>{page.title}</h1>
      <p>{page.summary}</p>
      {page.bodRefs.length > 0 && (
        <p className="ref-line">
          <span className="ref-label">Book of Discipline</span> <BodRefs refs={page.bodRefs} paras={paras} disciplineBase={`/${conf.slug}/discipline`} />
        </p>
      )}

      {page.contentMd && (
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.contentMd}</ReactMarkdown>
        </article>
      )}

      <EditProposal
        conference={conf.slug}
        targetType="PROCESS"
        targetRef={slug}
        signedIn={signedIn}
        fields={[
          { key: "summary", label: "Summary", current: page.summary },
          { key: "contentMd", label: "Full text", current: page.contentMd },
        ]}
      />

      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PROCESS" targetRef={slug} />
    </>
  );
}
