import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getConference, getBodParas } from "@/lib/conference";
import { getLang, pick } from "@/lib/lang";
import { prisma } from "@/lib/prisma";
import BodRefs from "@/components/BodRefs";
import Community from "@/components/Community";

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
          <span className="ref-label">Book of Discipline</span>{" "}
          <BodRefs refs={item.bodRefs} paras={paras} disciplineBase={`/${conf.slug}/discipline`} />
        </p>
      )}

      {content && (
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      )}
      {item.source && <p className="py-source">{es ? "Fuente" : "Source"}: {item.source}</p>}

      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="INFO" targetRef={slug} />
    </>
  );
}
