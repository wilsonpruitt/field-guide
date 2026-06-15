"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { reviewContribution, resolveFlags, setTrustLevel, reviewEdit } from "./actions";

// Mirrors lib/moderation TRUST_LABEL — inlined so this client bundle never imports Prisma.
const TRUST_LABEL: Record<number, string> = {
  0: "Visitor", 1: "Member", 2: "Regular", 3: "Editor", 4: "Steward",
};
const STANCE_LABEL: Record<string, string> = {
  IN_FAVOR: "In favor", CONCERN: "Concern", CLARIFICATION: "Clarification", ALTERNATIVE: "Alternative",
};

export function PendingItem({
  conference, id, kind, stance, body, author, when, targetLabel, targetHref,
}: {
  conference: string; id: string; kind: string; stance: string | null; body: string;
  author: string; when: string; targetLabel: string; targetHref: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = (decision: "PUBLISH" | "REJECT") =>
    start(async () => {
      const res = await reviewContribution(conference, id, decision);
      if (res.ok) setDone(decision === "PUBLISH" ? "Published" : "Rejected");
      else setError(res.error ?? "Something went wrong.");
    });

  if (done) return <li className="mod-item is-done">{done}.</li>;

  return (
    <li className="mod-item">
      <div className="mod-meta">
        <span className="mod-kind">{kind.toLowerCase()}{stance ? ` · ${STANCE_LABEL[stance] ?? stance}` : ""}</span>
        <Link href={targetHref} className="mod-target">{targetLabel}</Link>
      </div>
      <p className="mod-body">{body}</p>
      <p className="who">— {author}, {when}</p>
      <div className="mod-actions">
        <button className="btn-ok" disabled={pending} onClick={() => act("PUBLISH")}>Publish</button>
        <button className="btn-no" disabled={pending} onClick={() => act("REJECT")}>Reject</button>
        {error && <span className="mod-err">{error}</span>}
      </div>
    </li>
  );
}

export function FlaggedItem({
  conference, id, body, author, reasons, targetHref,
}: {
  conference: string; id: string; body: string; author: string;
  reasons: { by: string; reason: string }[]; targetHref: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  const act = (unpublish: boolean) =>
    start(async () => {
      const res = await resolveFlags(conference, id, unpublish);
      if (res.ok) setDone(unpublish ? "Unpublished" : "Flags dismissed");
    });

  if (done) return <li className="mod-item is-done">{done}.</li>;

  return (
    <li className="mod-item">
      <p className="mod-body">{body}</p>
      <p className="who">— {author} · <Link href={targetHref}>on the guide</Link></p>
      <ul className="mod-flags">
        {reasons.map((r, i) => (
          <li key={i}><strong>{r.by}:</strong> {r.reason}</li>
        ))}
      </ul>
      <div className="mod-actions">
        <button className="btn-ok" disabled={pending} onClick={() => act(false)}>Dismiss flags</button>
        <button className="btn-no" disabled={pending} onClick={() => act(true)}>Unpublish</button>
      </div>
    </li>
  );
}

export function EditItem({
  conference, id, fieldLabel, current, proposed, rationale, author, when, targetLabel, targetHref,
}: {
  conference: string; id: string; fieldLabel: string; current: string | null; proposed: string;
  rationale: string; author: string; when: string; targetLabel: string; targetHref: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = (decision: "APPLY" | "REJECT") =>
    start(async () => {
      const res = await reviewEdit(conference, id, decision);
      if (res.ok) setDone(decision === "APPLY" ? "Applied to the guide" : "Rejected");
      else setError(res.error ?? "Something went wrong.");
    });

  if (done) return <li className="mod-item is-done">{done}.</li>;

  return (
    <li className="mod-item">
      <div className="mod-meta">
        <span className="mod-kind">edit · {fieldLabel}</span>
        <Link href={targetHref} className="mod-target">{targetLabel}</Link>
      </div>
      <div className="edit-diff">
        <div className="edit-side">
          <span className="edit-side-label">Current</span>
          <p className="edit-old">{current ?? <span className="muted">(empty)</span>}</p>
        </div>
        <div className="edit-side">
          <span className="edit-side-label">Proposed</span>
          <p className="edit-new">{proposed}</p>
        </div>
      </div>
      {rationale && <p className="who">{rationale}</p>}
      <p className="who">— {author}, {when}</p>
      <div className="mod-actions">
        <button className="btn-ok" disabled={pending} onClick={() => act("APPLY")}>Apply edit</button>
        <button className="btn-no" disabled={pending} onClick={() => act("REJECT")}>Reject</button>
        {error && <span className="mod-err">{error}</span>}
      </div>
    </li>
  );
}

export function MemberRow({
  conference, membershipId, name, email, trustLevel, reputation, isSelf,
}: {
  conference: string; membershipId: string; name: string; email: string | null;
  trustLevel: number; reputation: number; isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [level, setLevel] = useState(trustLevel);
  const [saved, setSaved] = useState(false);

  const save = () =>
    start(async () => {
      const res = await setTrustLevel(conference, membershipId, level);
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    });

  return (
    <li className="mod-item mod-member">
      <div className="mod-member-id">
        <span className="mod-body">{name}{isSelf && <span className="pill">you</span>}</span>
        {email && <span className="who">{email} · {reputation} rep</span>}
      </div>
      <div className="mod-actions">
        <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="stance-select" disabled={isSelf}>
          {[0, 1, 2, 3, 4].map((l) => (
            <option key={l} value={l}>{TRUST_LABEL[l]}</option>
          ))}
        </select>
        <button className="btn-ok" disabled={pending || level === trustLevel || isSelf} onClick={save}>
          {saved ? "Saved" : "Set"}
        </button>
      </div>
    </li>
  );
}
