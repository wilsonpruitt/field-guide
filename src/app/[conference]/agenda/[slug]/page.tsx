import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getConference, getBodParas, votesLabel } from "@/lib/conference";
import { prisma } from "@/lib/prisma";
import BodRefs from "@/components/BodRefs";
import PerYearFinance, { type FinanceRow } from "@/components/PerYearFinance";
import NominationsSlate, { type NominationsData, type SlateBoard } from "@/components/NominationsSlate";
import Community from "@/components/Community";

export default async function AgendaDetail({
  params,
}: {
  params: Promise<{ conference: string; slug: string }>;
}) {
  const { conference, slug } = await params;
  const conf = await getConference(conference);

  const item = await prisma.agendaItem.findUnique({
    where: { conferenceId_slug: { conferenceId: conf.id, slug } },
  });
  if (!item) notFound();

  const [paras, agencyBody] = await Promise.all([
    getBodParas(),
    item.bodySlug
      ? prisma.body.findUnique({ where: { conferenceId_slug: { conferenceId: conf.id, slug: item.bodySlug } } })
      : Promise.resolve(null),
  ]);

  // Per-year data plate, if this item carries one.
  let perYear: React.ReactNode = null;
  if (item.perYear === "FINANCE") {
    const rows = await prisma.perYearInstance.findMany({
      where: { conferenceId: conf.id, kind: "FINANCE" },
      orderBy: { year: "asc" },
    });
    perYear = <PerYearFinance rows={rows.map((r) => r.data as FinanceRow)} />;
  } else if (item.perYear === "NOMINATIONS") {
    const [slate, rosters, bodies] = await Promise.all([
      prisma.perYearInstance.findFirst({ where: { conferenceId: conf.id, kind: "NOMINATIONS" } }),
      prisma.roster.findMany({
        where: { conferenceId: conf.id, year: 2026 },
        include: { members: { orderBy: { orderIndex: "asc" } } },
      }),
      prisma.body.findMany({ where: { conferenceId: conf.id } }),
    ]);
    const nameBySlug = new Map(bodies.map((b) => [b.slug, b.name]));
    const boards: SlateBoard[] = rosters
      .filter((r) => r.members.some((m) => m.district || m.status)) // elected boards from the report
      .map((r) => ({
        slug: r.bodySlug,
        name: nameBySlug.get(r.bodySlug) ?? r.bodySlug,
        toElect: r.toElect,
        nominees: r.members.filter((m) => m.nominee).map((m) => m.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (slate) {
      perYear = (
        <NominationsSlate
          data={slate.data as NominationsData}
          boards={boards}
          source={slate.source ?? ""}
          conference={conf.slug}
        />
      );
    }
  }

  return (
    <>
      <p className="eyebrow">Agenda · {votesLabel(item.votesOn) || "On the agenda"}</p>
      <h1>{item.title}</h1>
      <p>{item.summary}</p>
      {agencyBody && (
        <p>
          <span className="pill">
            <Link href={`/${conf.slug}/agencies/${agencyBody.slug}`}>{agencyBody.name}</Link>
          </span>
        </p>
      )}
      {item.bodRefs.length > 0 && (
        <p className="ref-line">
          <span className="ref-label">Book of Discipline</span> <BodRefs refs={item.bodRefs} paras={paras} />
        </p>
      )}

      {item.contentMd && (
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.contentMd}</ReactMarkdown>
        </article>
      )}

      {perYear}

      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="AGENDA" targetRef={slug} />
    </>
  );
}
