import { notFound } from "next/navigation";
import { getConference, getBodParas, votesLabel } from "@/lib/conference";
import { linkBase } from "@/lib/host";
import { pick } from "@/lib/lang";
import { langFor } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";
import BodRefs from "@/components/BodRefs";
import HandbookCite from "@/components/HandbookCite";
import BoardRoster, { type RosterData } from "@/components/BoardRoster";
import Community from "@/components/Community";
import EditProposal from "@/components/EditProposal";
import { getViewer } from "@/lib/community";

const votesLabelEs = (v?: string | null) =>
  v === "INFORMATION" ? "Solo para información"
  : v === "ACTION" ? "Para acción de la conferencia"
  : v === "BOTH" ? "Acción e información"
  : "";

type Fulfills = { name: string; bodRefs?: string[] };
type SubBody = { name: string; bodRefs?: string[]; membershipSize?: number; note?: string };

export default async function AgencyDetail({
  params,
}: {
  params: Promise<{ conference: string; slug: string }>;
}) {
  const { conference, slug } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), langFor(conference)]);
  const base = await linkBase(conf.slug);

  const body = await prisma.body.findUnique({
    where: { conferenceId_slug: { conferenceId: conf.id, slug } },
  });
  if (!body) notFound();

  const [paras, parent, roster, nominations] = await Promise.all([
    getBodParas(),
    body.parentId ? prisma.body.findUnique({ where: { id: body.parentId } }) : Promise.resolve(null),
    prisma.roster.findFirst({
      where: { conferenceId: conf.id, bodySlug: slug },
      orderBy: { year: "desc" },
      include: { members: { orderBy: { orderIndex: "asc" } } },
    }),
    prisma.perYearInstance.findFirst({ where: { conferenceId: conf.id, kind: "NOMINATIONS" } }),
  ]);
  const signedIn = !!(await getViewer(conf.id));

  const alsoFulfills = (body.alsoFulfills as Fulfills[] | null) ?? [];
  const subBodies = (body.subBodies as SubBody[] | null) ?? [];
  const asOf = (nominations?.data as { as_of?: string } | null)?.as_of ?? null;

  return (
    <>
      <p className="eyebrow">{body.type.toLowerCase().replace(/_/g, " ")}</p>
      <h1>{body.name}</h1>
      {body.alsoKnownAs && <p className="title-italic">{body.alsoKnownAs}</p>}
      {body.summary && <p>{body.summary}</p>}

      <dl className="spine-meta">
        {body.bodRefs.length > 0 && (
          <><dt>{pick(lang, "Book of Discipline", "Libro de Disciplina")}</dt><dd><BodRefs refs={body.bodRefs} paras={paras} disciplineBase={`${base}/discipline`} lang={lang} /></dd></>
        )}
        {body.membershipSize && (<><dt>{pick(lang, "Members", "Miembros")}</dt><dd>{body.membershipSize}</dd></>)}
        {parent && (<><dt>{pick(lang, "Part of", "Parte de")}</dt><dd>{parent.name}</dd></>)}
        {body.votesOn && (<><dt>{pick(lang, "At conference", "En la conferencia")}</dt><dd>{pick(lang, votesLabel(body.votesOn), votesLabelEs(body.votesOn))}</dd></>)}
        <dt>{pick(lang, "Accountable to", "Responde a")}</dt><dd>{body.accountableTo}</dd>
        {body.relatesTo.length > 0 && (<><dt>{pick(lang, "Relates to", "Se relaciona con")}</dt><dd>{body.relatesTo.join("; ")}</dd></>)}
      </dl>

      {body.sourcePage != null && (
        <HandbookCite source={conf.handbookLabel} page={body.sourcePage} handbookUrl={conf.handbookUrl} handbookLabel={conf.handbookLabel} lang={lang} />
      )}

      {alsoFulfills.length > 0 && (
        <p>
          {pick(lang, "Also fulfills:", "También cumple:")}{" "}
          {alsoFulfills.map((f, i) => (
            <span key={i}>
              {i > 0 ? "; " : ""}
              {f.name}
              {f.bodRefs && f.bodRefs.length > 0 && (
                <> (<BodRefs refs={f.bodRefs} paras={paras} disciplineBase={`${base}/discipline`} lang={lang} />)</>
              )}
            </span>
          ))}
          .
        </p>
      )}

      {subBodies.length > 0 && (
        <section>
          <h2>{pick(lang, "Boards, commissions & committees", "Juntas, comisiones y comités")}</h2>
          <ul className="bare">
            {subBodies.map((s, i) => (
              <li key={i}>
                {s.name}
                {s.bodRefs && s.bodRefs.length > 0 && (
                  <> <BodRefs refs={s.bodRefs} paras={paras} disciplineBase={`${base}/discipline`} pill lang={lang} /></>
                )}
                {s.note && <> — {s.note}</>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {roster && (
        <BoardRoster roster={roster as unknown as RosterData} asOf={asOf} base={base} lang={lang} />
      )}

      <EditProposal
        conference={conf.slug}
        lang={lang}
        targetType="BODY"
        targetRef={slug}
        signedIn={signedIn}
        fields={[{ key: "summary", label: "Summary", current: body.summary ?? "" }]}
      />

      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="BODY" targetRef={slug} />
    </>
  );
}
