import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getConference, getBodParas } from "@/lib/conference";
import { prisma } from "@/lib/prisma";
import BodRefs from "@/components/BodRefs";
import ActionPerspectives from "@/components/ActionPerspectives";

export default async function ActionDetail({
  params,
}: {
  params: Promise<{ conference: string; slug: string }>;
}) {
  const { conference, slug } = await params;
  const conf = await getConference(conference);

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

  return (
    <>
      <p className="eyebrow">For conference action{item.category ? ` · ${item.category}` : ""}</p>
      <h1>{item.title}</h1>
      {item.number && <p className="title-italic">{item.number} · {item.year}</p>}
      <p>{item.summary}</p>

      {agency && (
        <p><span className="pill"><Link href={`/${conf.slug}/agencies/${agency.slug}`}>{agency.name}</Link></span></p>
      )}
      {item.bodRefs.length > 0 && (
        <p className="ref-line">
          <span className="ref-label">Book of Discipline</span>{" "}
          <BodRefs refs={item.bodRefs} paras={paras} disciplineBase={`/${conf.slug}/discipline`} />
        </p>
      )}

      {item.contentMd && (
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.contentMd}</ReactMarkdown>
        </article>
      )}
      {item.source && <p className="py-source">Source: {item.source}</p>}

      <ActionPerspectives conferenceId={conf.id} conferenceSlug={conf.slug} slug={slug} />
    </>
  );
}
