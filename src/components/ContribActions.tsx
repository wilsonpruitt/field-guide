"use client";

import { useState, useTransition } from "react";
import { endorseContribution, flagContribution } from "@/app/[conference]/actions";
import { pick, type Lang } from "@/lib/lang";

type TargetType = "BODY" | "AGENDA" | "PROCESS" | "ACTION" | "INFO" | "PAGE";

export default function ContribActions({
  conference, contributionId, targetType, targetRef, endorsements, signedIn, lang,
}: {
  conference: string; contributionId: string; targetType: TargetType; targetRef: string;
  endorsements: number; signedIn: boolean; lang: Lang;
}) {
  const [pending, start] = useTransition();
  const [count, setCount] = useState(endorsements);
  const [endorsed, setEndorsed] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <p className="contrib-actions muted">
        {endorsements > 0
          ? pick(lang, `Endorsed by ${endorsements}`, `Respaldado por ${endorsements}`)
          : pick(lang, "Sign in to endorse or flag this.", "Inicia sesión para respaldar o reportar esto.")}
      </p>
    );
  }

  const endorse = () =>
    start(async () => {
      const res = await endorseContribution(conference, contributionId, targetType, targetRef);
      if (res.ok) { if (!endorsed) setCount((c) => c + 1); setEndorsed(true); }
      else setMsg(res.error ?? pick(lang, "Couldn't record that.", "No se pudo registrar eso."));
    });

  const submitFlag = () =>
    start(async () => {
      const res = await flagContribution(conference, contributionId, targetType, targetRef, reason);
      if (res.ok) { setFlagged(true); setFlagOpen(false); }
      else setMsg(res.error ?? pick(lang, "Couldn't record that.", "No se pudo registrar eso."));
    });

  return (
    <div className="contrib-actions">
      <button className="contrib-btn" disabled={pending || endorsed} onClick={endorse}>
        {endorsed ? pick(lang, "✓ Helpful", "✓ Útil") : pick(lang, "Helpful", "Útil")}{count > 0 ? ` · ${count}` : ""}
      </button>
      {flagged ? (
        <span className="muted">{pick(lang, "Flagged for review", "Reportado para revisión")}</span>
      ) : (
        <button className="contrib-btn" disabled={pending} onClick={() => setFlagOpen((v) => !v)}>
          {pick(lang, "Flag", "Reportar")}
        </button>
      )}
      {flagOpen && !flagged && (
        <span className="flag-row">
          <input
            type="text"
            className="flag-input"
            placeholder={pick(lang, "Why? (e.g. inaccurate, off-topic)", "¿Por qué? (p. ej. inexacto, fuera de tema)")}
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
          />
          <button className="contrib-btn" disabled={pending} onClick={submitFlag}>{pick(lang, "Send", "Enviar")}</button>
        </span>
      )}
      {msg && <span className="mod-err">{msg}</span>}
    </div>
  );
}
