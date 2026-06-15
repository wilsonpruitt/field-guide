import { getViewer, publishedFor, type PublicContribution } from "@/lib/community";
import Contribute, { AnswerForm } from "@/components/Contribute";
import ContribActions from "@/components/ContribActions";

const STANCE_ORDER = ["IN_FAVOR", "CONCERN", "CLARIFICATION", "ALTERNATIVE"] as const;
const STANCE_HEAD: Record<string, string> = {
  IN_FAVOR: "In favor", CONCERN: "Concerns", CLARIFICATION: "Clarifications", ALTERNATIVE: "Alternatives",
};
const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

// Perspectives gather around the things conference votes on, organized by where
// people stand. Same Contribution model as the rest of the community layer,
// just shaped for a decision.
export default async function ActionPerspectives({
  conferenceId,
  conferenceSlug,
  slug,
}: {
  conferenceId: string;
  conferenceSlug: string;
  slug: string;
}) {
  const [pub, viewer] = await Promise.all([
    publishedFor(conferenceId, "ACTION", slug),
    getViewer(conferenceId),
  ]);
  const common = {
    conference: conferenceSlug,
    targetType: "ACTION" as const,
    targetRef: slug,
    signedIn: !!viewer,
    autoPublish: !!viewer?.autoPublish,
  };

  const withStance = pub.notes.filter((n) => n.stance);
  const plain = pub.notes.filter((n) => !n.stance);
  const byStance = STANCE_ORDER.map((s) => ({ stance: s, items: withStance.filter((n) => n.stance === s) }))
    .filter((g) => g.items.length > 0);

  const card = (n: PublicContribution) => (
    <div className="note" key={n.id}>
      <p>{n.body}</p>
      <p className="who">— {n.authorLabel}, {fmt(n.createdAt)}</p>
      <ContribActions {...common} contributionId={n.id} endorsements={n.endorsements} />
    </div>
  );

  return (
    <>
      {byStance.length > 0 && (
        <section>
          <h2>Where people stand</h2>
          <div className="stance-grid">
            {byStance.map((g) => (
              <div key={g.stance} className={`stance-col stance-${g.stance.toLowerCase()}`}>
                <h3>{STANCE_HEAD[g.stance]} <span className="stance-count">{g.items.length}</span></h3>
                {g.items.map(card)}
              </div>
            ))}
          </div>
        </section>
      )}

      {plain.length > 0 && (
        <section>
          <h2>Notes</h2>
          {plain.map(card)}
        </section>
      )}

      {pub.questions.length > 0 && (
        <section>
          <h2>Questions</h2>
          {pub.questions.map((q) => (
            <div key={q.id} className={`q ${q.replies.length ? "answered" : ""}`}>
              <p><strong>{q.body}</strong></p>
              <p className="who">— {q.authorLabel}, {fmt(q.createdAt)}</p>
              {q.replies.map((a) => (
                <p key={a.id} className="q-answer">{a.body} <span className="who">— {a.authorLabel}</span></p>
              ))}
              <ContribActions {...common} contributionId={q.id} endorsements={q.endorsements} />
              <AnswerForm {...common} parentId={q.id} />
            </div>
          ))}
        </section>
      )}

      <section className="contribute-block">
        <h2>Weigh in</h2>
        <p className="muted">
          {viewer
            ? viewer.autoPublish
              ? "Your perspective posts to the guide right away."
              : "New contributions are reviewed before they appear."
            : "Anyone can weigh in. Signed-out contributions are reviewed first; sign in to build standing."}
        </p>
        <Contribute {...common} />
      </section>
    </>
  );
}
