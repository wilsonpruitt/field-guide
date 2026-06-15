"use client";

import { useActionState, useState } from "react";
import { submitContribution, type SubmitResult } from "@/app/[conference]/actions";
import { pick, type Lang } from "@/lib/lang";

type Common = {
  conference: string;
  targetType: "BODY" | "AGENDA" | "PROCESS" | "ACTION" | "INFO";
  targetRef: string;
  signedIn: boolean;
  autoPublish: boolean;
  lang: Lang;
  sections?: { title: string; slug: string }[];
};

const stances = (lang: Lang): [string, string][] => [
  ["", pick(lang, "Just a note", "Solo una nota")],
  ["IN_FAVOR", pick(lang, "In favor", "A favor")],
  ["CONCERN", pick(lang, "A concern", "Una inquietud")],
  ["CLARIFICATION", pick(lang, "A clarification", "Una aclaración")],
  ["ALTERNATIVE", pick(lang, "An alternative", "Una alternativa")],
];

const successCopy = (lang: Lang, status?: "PUBLISHED" | "PENDING") =>
  status === "PUBLISHED"
    ? pick(lang, "Posted — thanks for adding to the guide.", "Publicado — gracias por aportar a la guía.")
    : pick(lang, "Thanks — it'll appear here once it's reviewed.", "Gracias — aparecerá aquí una vez que se revise.");

/** One form: a question, a note/perspective, or an inline answer. */
function ContributeForm({
  mode,
  parentId,
  toggleLabel,
  placeholder,
  inline = false,
  conference,
  targetType,
  targetRef,
  signedIn,
  autoPublish,
  lang,
  sections,
}: Common & {
  mode: "question" | "note" | "answer";
  parentId?: string;
  toggleLabel: string;
  placeholder: string;
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stance, setStance] = useState("");
  const [section, setSection] = useState("");
  const [state, formAction, pending] = useActionState<SubmitResult | null, FormData>(
    submitContribution,
    null,
  );

  const type = mode === "question" ? "QUESTION" : mode === "answer" ? "ANSWER" : stance ? "PERSPECTIVE" : "COMMENT";
  const submitRef = mode !== "answer" && section ? `${targetRef}#${section}` : targetRef;
  const reviewNote = autoPublish
    ? pick(lang, "Posts to the guide right away.", "Se publica en la guía de inmediato.")
    : pick(lang, "It'll be reviewed before it appears.", "Se revisará antes de aparecer.");

  if (state?.ok) {
    return <p className="ask-status">{successCopy(lang, state.status)}</p>;
  }

  return (
    <div className={inline ? "answer-box" : "ask"}>
      <button
        type="button"
        className="ask-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {toggleLabel}
      </button>
      {open && (
        <form className="ask-form" action={formAction}>
          <input type="hidden" name="conferenceSlug" value={conference} />
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetRef" value={submitRef} />
          <input type="hidden" name="type" value={type} />
          {parentId && <input type="hidden" name="parentId" value={parentId} />}
          {mode === "note" && <input type="hidden" name="stance" value={stance} />}

          <textarea name="body" rows={inline ? 2 : 3} maxLength={4000} required placeholder={placeholder} />

          {mode !== "answer" && sections && sections.length > 0 && (
            <div className="ask-row">
              <label className="stance-label">
                {pick(lang, "About", "Sobre")}
                <select value={section} onChange={(e) => setSection(e.target.value)} className="stance-select">
                  <option value="">{pick(lang, "the whole page", "toda la página")}</option>
                  {sections.map((s) => (
                    <option key={s.slug} value={s.slug}>{s.title}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {mode === "note" && (
            <div className="ask-row">
              <label className="stance-label">
                This is…
                <select value={stance} onChange={(e) => setStance(e.target.value)} className="stance-select">
                  {stances(lang).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="ask-row">
            {!signedIn && (
              <input type="text" name="authorName" placeholder={pick(lang, "Your name (optional)", "Tu nombre (opcional)")} maxLength={80} autoComplete="name" />
            )}
            {/* Honeypot — must stay empty. */}
            <input type="text" name="website" className="ask-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button type="submit" className="ask-submit" disabled={pending}>
              {pending ? pick(lang, "Sending…", "Enviando…") : pick(lang, "Send", "Enviar")}
            </button>
          </div>
          <p className="ask-status" role="status" aria-live="polite">
            {state?.error ?? reviewNote}
          </p>
        </form>
      )}
    </div>
  );
}

/** Bottom-of-page block: ask a question + share a note/perspective. */
export default function Contribute(props: Common) {
  const { lang } = props;
  return (
    <div className="contribute">
      <ContributeForm
        {...props}
        mode="question"
        toggleLabel={pick(lang, "Ask a question about this →", "Hacer una pregunta sobre esto →")}
        placeholder={pick(lang, "What would you like to know about this?", "¿Qué te gustaría saber sobre esto?")}
      />
      <ContributeForm
        {...props}
        mode="note"
        toggleLabel={pick(lang, "Share a note or perspective →", "Compartir una nota o perspectiva →")}
        placeholder={pick(lang, "Add context, a concern, or another way of seeing this.", "Aporta contexto, una inquietud u otra manera de ver esto.")}
      />
    </div>
  );
}

/** Inline answer form, shown under an open question. */
export function AnswerForm(props: Common & { parentId: string }) {
  const { lang } = props;
  return (
    <ContributeForm
      {...props}
      mode="answer"
      toggleLabel={pick(lang, "Answer this →", "Responder esto →")}
      placeholder={pick(lang, "Share what you know — sources welcome.", "Comparte lo que sepas — se agradecen las fuentes.")}
      inline
    />
  );
}
