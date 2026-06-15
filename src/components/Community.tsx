import { getViewer, publishedFor, type PublicContribution } from "@/lib/community";
import { pick, type Lang } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import Contribute, { AnswerForm } from "@/components/Contribute";
import ContribActions from "@/components/ContribActions";

type TargetType = "BODY" | "AGENDA" | "PROCESS" | "INFO";

const stanceLabel = (lang: Lang, stance: string): string =>
  ({
    IN_FAVOR: pick(lang, "In favor", "A favor"),
    CONCERN: pick(lang, "Concern", "Inquietud"),
    CLARIFICATION: pick(lang, "Clarification", "Aclaración"),
    ALTERNATIVE: pick(lang, "Alternative", "Alternativa"),
  })[stance] ?? stance;
const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

function Note({
  n, conference, targetType, targetRef, signedIn, lang,
}: {
  n: PublicContribution; conference: string; targetType: TargetType; targetRef: string; signedIn: boolean; lang: Lang;
}) {
  return (
    <div className="note">
      {n.stance && <span className="stance-tag">{stanceLabel(lang, n.stance)}</span>}
      <p>{n.body}</p>
      <p className="who">— {n.authorLabel}, {fmt(n.createdAt)}</p>
      <ContribActions
        conference={conference}
        contributionId={n.id}
        targetType={targetType}
        targetRef={targetRef}
        endorsements={n.endorsements}
        signedIn={signedIn}
        lang={lang}
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
  const [pub, viewer, lang] = await Promise.all([
    publishedFor(conferenceId, targetType, targetRef),
    getViewer(conferenceId),
    getLang(),
  ]);

  const common = {
    conference: conferenceSlug,
    targetType,
    targetRef,
    signedIn: !!viewer,
    autoPublish: !!viewer?.autoPublish,
    lang,
  };

  return (
    <>
      {pub.notes.length > 0 && (
        <section>
          <h2>{pick(lang, "Notes from the floor", "Notas desde el plenario")}</h2>
          {pub.notes.map((n) => (
            <Note key={n.id} n={n} conference={conferenceSlug} targetType={targetType} targetRef={targetRef} signedIn={!!viewer} lang={lang} />
          ))}
        </section>
      )}

      {pub.questions.length > 0 && (
        <section>
          <h2>{pick(lang, "Questions", "Preguntas")}</h2>
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
                lang={lang}
              />
              <AnswerForm {...common} parentId={q.id} />
            </div>
          ))}
        </section>
      )}

      <section className="contribute-block">
        <h2>{pick(lang, "Add to the guide", "Aportar a la guía")}</h2>
        <p className="muted">
          {viewer
            ? viewer.autoPublish
              ? pick(lang, "Your contributions post to the guide right away.", "Tus contribuciones se publican en la guía de inmediato.")
              : pick(lang, "New contributions are reviewed before they appear — thanks for your patience.", "Las contribuciones nuevas se revisan antes de aparecer — gracias por tu paciencia.")
            : pick(lang, "Anyone can contribute. Signed-out notes are reviewed before they appear; sign in to build standing in this conference.", "Cualquiera puede aportar. Las notas sin sesión se revisan antes de aparecer; inicia sesión para ganar reconocimiento en esta conferencia.")}
        </p>
        <Contribute {...common} />
      </section>
    </>
  );
}
