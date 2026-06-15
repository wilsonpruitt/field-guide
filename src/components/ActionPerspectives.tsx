import { getViewer, publishedFor, type PublicContribution } from "@/lib/community";
import { pick, type Lang } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import Contribute, { AnswerForm } from "@/components/Contribute";
import ContribActions from "@/components/ContribActions";

const STANCE_ORDER = ["IN_FAVOR", "CONCERN", "CLARIFICATION", "ALTERNATIVE"] as const;
const stanceHead = (lang: Lang, stance: string): string =>
  ({
    IN_FAVOR: pick(lang, "In favor", "A favor"),
    CONCERN: pick(lang, "Concerns", "Inquietudes"),
    CLARIFICATION: pick(lang, "Clarifications", "Aclaraciones"),
    ALTERNATIVE: pick(lang, "Alternatives", "Alternativas"),
  })[stance] ?? stance;
const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const deSlug = (s: string) => s.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

// Perspectives gather around the things conference votes on, organized by where
// people stand. Same Contribution model as the rest of the community layer,
// just shaped for a decision.
export default async function ActionPerspectives({
  conferenceId,
  conferenceSlug,
  slug,
  sections = [],
}: {
  conferenceId: string;
  conferenceSlug: string;
  slug: string;
  sections?: { title: string; slug: string }[];
}) {
  const [pub, viewer, lang] = await Promise.all([
    publishedFor(conferenceId, "ACTION", slug),
    getViewer(conferenceId),
    getLang(),
  ]);
  const common = {
    conference: conferenceSlug,
    targetType: "ACTION" as const,
    targetRef: slug,
    signedIn: !!viewer,
    autoPublish: !!viewer?.autoPublish,
    lang,
    sections,
  };

  const withStance = pub.notes.filter((n) => n.stance);
  const plain = pub.notes.filter((n) => !n.stance);
  const byStance = STANCE_ORDER.map((s) => ({ stance: s, items: withStance.filter((n) => n.stance === s) }))
    .filter((g) => g.items.length > 0);

  const card = (n: PublicContribution) => (
    <div className="note" id={`c-${n.id}`} key={n.id}>
      {n.anchor && <span className="anno-on">{pick(lang, "On", "Sobre")}: {deSlug(n.anchor)}</span>}
      <p>{n.body}</p>
      <p className="who">— {n.authorLabel}, {fmt(n.createdAt)}</p>
      <ContribActions {...common} contributionId={n.id} endorsements={n.endorsements} />
    </div>
  );

  return (
    <>
      {byStance.length > 0 && (
        <section>
          <h2>{pick(lang, "Where people stand", "Dónde se posiciona la gente")}</h2>
          <div className="stance-grid">
            {byStance.map((g) => (
              <div key={g.stance} className={`stance-col stance-${g.stance.toLowerCase()}`}>
                <h3>{stanceHead(lang, g.stance)} <span className="stance-count">{g.items.length}</span></h3>
                {g.items.map(card)}
              </div>
            ))}
          </div>
        </section>
      )}

      {plain.length > 0 && (
        <section>
          <h2>{pick(lang, "Notes", "Notas")}</h2>
          {plain.map(card)}
        </section>
      )}

      {pub.questions.length > 0 && (
        <section>
          <h2>{pick(lang, "Questions", "Preguntas")}</h2>
          {pub.questions.map((q) => (
            <div key={q.id} id={`c-${q.id}`} className={`q ${q.replies.length ? "answered" : ""}`}>
              {q.anchor && <span className="anno-on">{pick(lang, "On", "Sobre")}: {deSlug(q.anchor)}</span>}
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
        <h2>{pick(lang, "Weigh in", "Opina")}</h2>
        <p className="muted">
          {viewer
            ? viewer.autoPublish
              ? pick(lang, "Your perspective posts to the guide right away.", "Tu perspectiva se publica en la guía de inmediato.")
              : pick(lang, "New contributions are reviewed before they appear.", "Las contribuciones nuevas se revisan antes de aparecer.")
            : pick(lang, "Anyone can weigh in. Signed-out contributions are reviewed first; sign in to build standing.", "Cualquiera puede opinar. Las contribuciones sin sesión se revisan primero; inicia sesión para ganar reconocimiento.")}
        </p>
        <Contribute {...common} />
      </section>
    </>
  );
}
