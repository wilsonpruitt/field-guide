import { notFound } from "next/navigation";
import { getConference, getBodParas, votesLabel } from "@/lib/conference";
import { prisma } from "@/lib/prisma";
import BodRefs from "@/components/BodRefs";
import BoardRoster, { type RosterData } from "@/components/BoardRoster";
import Community from "@/components/Community";
import EditProposal from "@/components/EditProposal";
import { getViewer } from "@/lib/community";

type Fulfills = { name: string; bodRefs?: string[] };
type SubBody = { name: string; bodRefs?: string[]; membershipSize?: number; note?: string };

export default async function AgencyDetail({
  params,
}: {
  params: Promise<{ conference: string; slug: string }>;
}) {
  const { conference, slug } = await params;
  const conf = await getConference(conference);

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
          <><dt>Book of Discipline</dt><dd><BodRefs refs={body.bodRefs} paras={paras} disciplineBase={`/${conf.slug}/discipline`} /></dd></>
        )}
        {body.membershipSize && (<><dt>Members</dt><dd>{body.membershipSize}</dd></>)}
        {parent && (<><dt>Part of</dt><dd>{parent.name}</dd></>)}
        {body.votesOn && (<><dt>At conference</dt><dd>{votesLabel(body.votesOn)}</dd></>)}
        <dt>Accountable to</dt><dd>{body.accountableTo}</dd>
        {body.relatesTo.length > 0 && (<><dt>Relates to</dt><dd>{body.relatesTo.join("; ")}</dd></>)}
      </dl>

      {alsoFulfills.length > 0 && (
        <p>
          Also fulfills:{" "}
          {alsoFulfills.map((f, i) => (
            <span key={i}>
              {i > 0 ? "; " : ""}
              {f.name}
              {f.bodRefs && f.bodRefs.length > 0 && (
                <> (<BodRefs refs={f.bodRefs} paras={paras} disciplineBase={`/${conf.slug}/discipline`} />)</>
              )}
            </span>
          ))}
          .
        </p>
      )}

      {subBodies.length > 0 && (
        <section>
          <h2>Boards, commissions &amp; committees</h2>
          <ul className="bare">
            {subBodies.map((s, i) => (
              <li key={i}>
                {s.name}
                {s.bodRefs && s.bodRefs.length > 0 && (
                  <> <BodRefs refs={s.bodRefs} paras={paras} disciplineBase={`/${conf.slug}/discipline`} pill /></>
                )}
                {s.note && <> — {s.note}</>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {roster && (
        <BoardRoster roster={roster as unknown as RosterData} asOf={asOf} conference={conf.slug} />
      )}

      <EditProposal
        conference={conf.slug}
        targetType="BODY"
        targetRef={slug}
        signedIn={signedIn}
        fields={[{ key: "summary", label: "Summary", current: body.summary ?? "" }]}
      />

      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="BODY" targetRef={slug} />
    </>
  );
}
