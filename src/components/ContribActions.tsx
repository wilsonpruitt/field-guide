"use client";

import { useState, useTransition } from "react";
import { endorseContribution, flagContribution } from "@/app/[conference]/actions";

type TargetType = "BODY" | "AGENDA" | "PROCESS" | "ACTION";

export default function ContribActions({
  conference, contributionId, targetType, targetRef, endorsements, signedIn,
}: {
  conference: string; contributionId: string; targetType: TargetType; targetRef: string;
  endorsements: number; signedIn: boolean;
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
        {endorsements > 0 ? `Endorsed by ${endorsements}` : "Sign in to endorse or flag this."}
      </p>
    );
  }

  const endorse = () =>
    start(async () => {
      const res = await endorseContribution(conference, contributionId, targetType, targetRef);
      if (res.ok) { if (!endorsed) setCount((c) => c + 1); setEndorsed(true); }
      else setMsg(res.error ?? "Couldn't record that.");
    });

  const submitFlag = () =>
    start(async () => {
      const res = await flagContribution(conference, contributionId, targetType, targetRef, reason);
      if (res.ok) { setFlagged(true); setFlagOpen(false); }
      else setMsg(res.error ?? "Couldn't record that.");
    });

  return (
    <div className="contrib-actions">
      <button className="contrib-btn" disabled={pending || endorsed} onClick={endorse}>
        {endorsed ? "✓ Helpful" : "Helpful"}{count > 0 ? ` · ${count}` : ""}
      </button>
      {flagged ? (
        <span className="muted">Flagged for review</span>
      ) : (
        <button className="contrib-btn" disabled={pending} onClick={() => setFlagOpen((v) => !v)}>
          Flag
        </button>
      )}
      {flagOpen && !flagged && (
        <span className="flag-row">
          <input
            type="text"
            className="flag-input"
            placeholder="Why? (e.g. inaccurate, off-topic)"
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
          />
          <button className="contrib-btn" disabled={pending} onClick={submitFlag}>Send</button>
        </span>
      )}
      {msg && <span className="mod-err">{msg}</span>}
    </div>
  );
}
