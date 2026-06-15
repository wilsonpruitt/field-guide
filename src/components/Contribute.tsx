"use client";

import { useActionState, useState } from "react";
import { submitContribution, type SubmitResult } from "@/app/[conference]/actions";

type Common = {
  conference: string;
  targetType: "BODY" | "AGENDA" | "PROCESS";
  targetRef: string;
  signedIn: boolean;
  autoPublish: boolean;
};

const STANCES: [string, string][] = [
  ["", "Just a note"],
  ["IN_FAVOR", "In favor"],
  ["CONCERN", "A concern"],
  ["CLARIFICATION", "A clarification"],
  ["ALTERNATIVE", "An alternative"],
];

const successCopy = (status?: "PUBLISHED" | "PENDING") =>
  status === "PUBLISHED" ? "Posted — thanks for adding to the guide." : "Thanks — it'll appear here once it's reviewed.";

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
}: Common & {
  mode: "question" | "note" | "answer";
  parentId?: string;
  toggleLabel: string;
  placeholder: string;
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stance, setStance] = useState("");
  const [state, formAction, pending] = useActionState<SubmitResult | null, FormData>(
    submitContribution,
    null,
  );

  const type = mode === "question" ? "QUESTION" : mode === "answer" ? "ANSWER" : stance ? "PERSPECTIVE" : "COMMENT";
  const reviewNote = autoPublish ? "Posts to the guide right away." : "It'll be reviewed before it appears.";

  if (state?.ok) {
    return <p className="ask-status">{successCopy(state.status)}</p>;
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
          <input type="hidden" name="targetRef" value={targetRef} />
          <input type="hidden" name="type" value={type} />
          {parentId && <input type="hidden" name="parentId" value={parentId} />}
          {mode === "note" && <input type="hidden" name="stance" value={stance} />}

          <textarea name="body" rows={inline ? 2 : 3} maxLength={4000} required placeholder={placeholder} />

          {mode === "note" && (
            <div className="ask-row">
              <label className="stance-label">
                This is…
                <select value={stance} onChange={(e) => setStance(e.target.value)} className="stance-select">
                  {STANCES.map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="ask-row">
            {!signedIn && (
              <input type="text" name="authorName" placeholder="Your name (optional)" maxLength={80} autoComplete="name" />
            )}
            {/* Honeypot — must stay empty. */}
            <input type="text" name="website" className="ask-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button type="submit" className="ask-submit" disabled={pending}>
              {pending ? "Sending…" : "Send"}
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
  return (
    <div className="contribute">
      <ContributeForm
        {...props}
        mode="question"
        toggleLabel="Ask a question about this →"
        placeholder="What would you like to know about this?"
      />
      <ContributeForm
        {...props}
        mode="note"
        toggleLabel="Share a note or perspective →"
        placeholder="Add context, a concern, or another way of seeing this."
      />
    </div>
  );
}

/** Inline answer form, shown under an open question. */
export function AnswerForm(props: Common & { parentId: string }) {
  return (
    <ContributeForm
      {...props}
      mode="answer"
      toggleLabel="Answer this →"
      placeholder="Share what you know — sources welcome."
      inline
    />
  );
}
