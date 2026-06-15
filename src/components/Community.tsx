import { getViewer, publishedFor, type PublicContribution } from "@/lib/community";
import Contribute, { AnswerForm } from "@/components/Contribute";
import ContribActions from "@/components/ContribActions";

type TargetType = "BODY" | "AGENDA" | "PROCESS" | "INFO";

const STANCE_LABEL: Record<string, string> = {
  IN_FAVOR: "In favor", CONCERN: "Concern", CLARIFICATION: "Clarification", ALTERNATIVE: "Alternative",
};
const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

function Note({
  n, conference, targetType, targetRef, signedIn,
}: {
  n: PublicContribution; conference: string; targetType: TargetType; targetRef: string; signedIn: boolean;
}) {
  return (
    <div className="note">
      {n.stance && <span className="stance-tag">{STANCE_LABEL[n.stance] ?? n.stance}</span>}
      <p>{n.body}</p>
      <p className="who">— {n.authorLabel}, {fmt(n.createdAt)}</p>
      <ContribActions
        conference={conference}
        contributionId={n.id}
        targetType={targetType}
        targetRef={targetRef}
        endorsements={n.endorsements}
        signedIn={signedIn}
      />
    </div>
  );
}

export default async function Community({
  conferenceId,
  conferenceSlug,
  targetType,
  targetRef,
}: {
  conferenceId: string;
  conferenceSlug: string;
  targetType: TargetType;
  targetRef: string;
}) {
  const [pub, viewer] = await Promise.all([
    publishedFor(conferenceId, targetType, targetRef),
    getViewer(conferenceId),
  ]);

  const common = {
    conference: conferenceSlug,
    targetType,
    targetRef,
    signedIn: !!viewer,
    autoPublish: !!viewer?.autoPublish,
  };

  return (
    <>
      {pub.notes.length > 0 && (
        <section>
          <h2>Notes from the floor</h2>
          {pub.notes.map((n) => (
            <Note key={n.id} n={n} conference={conferenceSlug} targetType={targetType} targetRef={targetRef} signedIn={!!viewer} />
          ))}
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
                <p key={a.id} className="q-answer">
                  {a.body} <span className="who">— {a.authorLabel}</span>
                </p>
              ))}
              <ContribActions
                conference={conferenceSlug}
                contributionId={q.id}
                targetType={targetType}
                targetRef={targetRef}
                endorsements={q.endorsements}
                signedIn={!!viewer}
              />
              <AnswerForm {...common} parentId={q.id} />
            </div>
          ))}
        </section>
      )}

      <section className="contribute-block">
        <h2>Add to the guide</h2>
        <p className="muted">
          {viewer
            ? viewer.autoPublish
              ? "Your contributions post to the guide right away."
              : "New contributions are reviewed before they appear — thanks for your patience."
            : "Anyone can contribute. Signed-out notes are reviewed before they appear; sign in to build standing in this conference."}
        </p>
        <Contribute {...common} />
      </section>
    </>
  );
}
