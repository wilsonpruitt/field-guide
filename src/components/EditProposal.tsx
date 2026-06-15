"use client";

import { useState, useTransition } from "react";
import { proposeEdit } from "@/app/[conference]/actions";

type TargetType = "BODY" | "AGENDA" | "PROCESS" | "ACTION" | "INFO";
type Field = { key: string; label: string; current: string };

// "Suggest an edit" to the canonical spine text. Signed-in only; always queued
// for a steward to apply (see the steward's desk).
export default function EditProposal({
  conference,
  targetType,
  targetRef,
  signedIn,
  fields,
}: {
  conference: string;
  targetType: TargetType;
  targetRef: string;
  signedIn: boolean;
  fields: Field[];
}) {
  const [open, setOpen] = useState(false);
  const [fieldKey, setFieldKey] = useState(fields[0]?.key ?? "");
  const [text, setText] = useState(fields[0]?.current ?? "");
  const [rationale, setRationale] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (fields.length === 0) return null;

  const chooseField = (key: string) => {
    setFieldKey(key);
    setText(fields.find((f) => f.key === key)?.current ?? "");
  };

  const submit = () =>
    start(async () => {
      const res = await proposeEdit(conference, targetType, targetRef, fieldKey, text, rationale);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Something went wrong.");
    });

  return (
    <div className="edit-proposal">
      {done ? (
        <p className="ask-status">Thanks — your suggested edit was sent to the stewards for review.</p>
      ) : (
        <>
          <button type="button" className="ask-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            Suggest an edit →
          </button>
          {open && (
            <div className="ask-form">
              {!signedIn ? (
                <p className="muted">Editing the guide text is for signed-in members, so changes carry a name. Please sign in.</p>
              ) : (
                <>
                  {fields.length > 1 && (
                    <div className="ask-row">
                      <label className="stance-label">
                        Edit
                        <select className="stance-select" value={fieldKey} onChange={(e) => chooseField(e.target.value)}>
                          {fields.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                  <textarea
                    rows={6}
                    maxLength={8000}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="The corrected or improved text"
                  />
                  <input
                    type="text"
                    className="edit-rationale"
                    maxLength={1000}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Why this change? (optional)"
                  />
                  <div className="ask-row">
                    <button className="ask-submit" disabled={pending} onClick={submit}>
                      {pending ? "Sending…" : "Propose edit"}
                    </button>
                    {error && <span className="mod-err">{error}</span>}
                  </div>
                  <p className="ask-status">Edits are applied by a steward after review.</p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
