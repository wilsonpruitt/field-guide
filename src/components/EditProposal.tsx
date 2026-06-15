"use client";

import { useState, useTransition } from "react";
import { proposeEdit } from "@/app/[conference]/actions";
import { pick, type Lang } from "@/lib/lang";

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
  lang,
}: {
  conference: string;
  targetType: TargetType;
  targetRef: string;
  signedIn: boolean;
  fields: Field[];
  lang: Lang;
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
      else setError(res.error ?? pick(lang, "Something went wrong.", "Algo salió mal."));
    });

  return (
    <div className="edit-proposal">
      {done ? (
        <p className="ask-status">{pick(lang, "Thanks — your suggested edit was sent to the stewards for review.", "Gracias — tu edición sugerida se envió a los custodios para revisión.")}</p>
      ) : (
        <>
          <button type="button" className="ask-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {pick(lang, "Suggest an edit →", "Sugerir una edición →")}
          </button>
          {open && (
            <div className="ask-form">
              {!signedIn ? (
                <p className="muted">{pick(lang, "Editing the guide text is for signed-in members, so changes carry a name. Please sign in.", "Editar el texto de la guía es para miembros con sesión iniciada, para que los cambios lleven un nombre. Por favor inicia sesión.")}</p>
              ) : (
                <>
                  {fields.length > 1 && (
                    <div className="ask-row">
                      <label className="stance-label">
                        {pick(lang, "Edit", "Editar")}
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
                    placeholder={pick(lang, "The corrected or improved text", "El texto corregido o mejorado")}
                  />
                  <input
                    type="text"
                    className="edit-rationale"
                    maxLength={1000}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder={pick(lang, "Why this change? (optional)", "¿Por qué este cambio? (opcional)")}
                  />
                  <div className="ask-row">
                    <button className="ask-submit" disabled={pending} onClick={submit}>
                      {pending ? pick(lang, "Sending…", "Enviando…") : pick(lang, "Propose edit", "Proponer edición")}
                    </button>
                    {error && <span className="mod-err">{error}</span>}
                  </div>
                  <p className="ask-status">{pick(lang, "Edits are applied by a steward after review.", "Las ediciones las aplica un custodio tras la revisión.")}</p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
