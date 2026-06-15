"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { reviewContribution, resolveFlags, setTrustLevel, reviewEdit } from "./actions";
import { pick, type Lang } from "@/lib/lang";

// Mirrors lib/moderation TRUST_LABEL — inlined so this client bundle never imports Prisma.
const trustLabel = (lang: Lang, l: number): string =>
  ([
    pick(lang, "Visitor", "Visitante"),
    pick(lang, "Member", "Miembro"),
    pick(lang, "Regular", "Habitual"),
    pick(lang, "Editor", "Editor"),
    pick(lang, "Steward", "Custodio"),
  ][l] ?? "");
const stanceLabel = (lang: Lang, s: string): string =>
  (({
    IN_FAVOR: pick(lang, "In favor", "A favor"),
    CONCERN: pick(lang, "Concern", "Inquietud"),
    CLARIFICATION: pick(lang, "Clarification", "Aclaración"),
    ALTERNATIVE: pick(lang, "Alternative", "Alternativa"),
  }) as Record<string, string>)[s] ?? s;

export function PendingItem({
  lang, conference, id, kind, stance, body, author, when, targetLabel, targetHref,
}: {
  lang: Lang; conference: string; id: string; kind: string; stance: string | null; body: string;
  author: string; when: string; targetLabel: string; targetHref: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = (decision: "PUBLISH" | "REJECT") =>
    start(async () => {
      const res = await reviewContribution(conference, id, decision);
      if (res.ok) setDone(decision === "PUBLISH" ? pick(lang, "Published", "Publicado") : pick(lang, "Rejected", "Rechazado"));
      else setError(res.error ?? pick(lang, "Something went wrong.", "Algo salió mal."));
    });

  if (done) return <li className="mod-item is-done">{done}.</li>;

  return (
    <li className="mod-item">
      <div className="mod-meta">
        <span className="mod-kind">{kind.toLowerCase()}{stance ? ` · ${stanceLabel(lang, stance)}` : ""}</span>
        <Link href={targetHref} className="mod-target">{targetLabel}</Link>
      </div>
      <p className="mod-body">{body}</p>
      <p className="who">— {author}, {when}</p>
      <div className="mod-actions">
        <button className="btn-ok" disabled={pending} onClick={() => act("PUBLISH")}>{pick(lang, "Publish", "Publicar")}</button>
        <button className="btn-no" disabled={pending} onClick={() => act("REJECT")}>{pick(lang, "Reject", "Rechazar")}</button>
        {error && <span className="mod-err">{error}</span>}
      </div>
    </li>
  );
}

export function FlaggedItem({
  lang, conference, id, body, author, reasons, targetHref,
}: {
  lang: Lang; conference: string; id: string; body: string; author: string;
  reasons: { by: string; reason: string }[]; targetHref: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  const act = (unpublish: boolean) =>
    start(async () => {
      const res = await resolveFlags(conference, id, unpublish);
      if (res.ok) setDone(unpublish ? pick(lang, "Unpublished", "Despublicado") : pick(lang, "Flags dismissed", "Reportes descartados"));
    });

  if (done) return <li className="mod-item is-done">{done}.</li>;

  return (
    <li className="mod-item">
      <p className="mod-body">{body}</p>
      <p className="who">— {author} · <Link href={targetHref}>{pick(lang, "on the guide", "en la guía")}</Link></p>
      <ul className="mod-flags">
        {reasons.map((r, i) => (
          <li key={i}><strong>{r.by}:</strong> {r.reason}</li>
        ))}
      </ul>
      <div className="mod-actions">
        <button className="btn-ok" disabled={pending} onClick={() => act(false)}>{pick(lang, "Dismiss flags", "Descartar reportes")}</button>
        <button className="btn-no" disabled={pending} onClick={() => act(true)}>{pick(lang, "Unpublish", "Despublicar")}</button>
      </div>
    </li>
  );
}

export function EditItem({
  lang, conference, id, fieldLabel, current, proposed, rationale, author, when, targetLabel, targetHref,
}: {
  lang: Lang; conference: string; id: string; fieldLabel: string; current: string | null; proposed: string;
  rationale: string; author: string; when: string; targetLabel: string; targetHref: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = (decision: "APPLY" | "REJECT") =>
    start(async () => {
      const res = await reviewEdit(conference, id, decision);
      if (res.ok) setDone(decision === "APPLY" ? pick(lang, "Applied to the guide", "Aplicado a la guía") : pick(lang, "Rejected", "Rechazado"));
      else setError(res.error ?? pick(lang, "Something went wrong.", "Algo salió mal."));
    });

  if (done) return <li className="mod-item is-done">{done}.</li>;

  return (
    <li className="mod-item">
      <div className="mod-meta">
        <span className="mod-kind">{pick(lang, "edit", "edición")} · {fieldLabel}</span>
        <Link href={targetHref} className="mod-target">{targetLabel}</Link>
      </div>
      <div className="edit-diff">
        <div className="edit-side">
          <span className="edit-side-label">{pick(lang, "Current", "Actual")}</span>
          <p className="edit-old">{current ?? <span className="muted">{pick(lang, "(empty)", "(vacío)")}</span>}</p>
        </div>
        <div className="edit-side">
          <span className="edit-side-label">{pick(lang, "Proposed", "Propuesta")}</span>
          <p className="edit-new">{proposed}</p>
        </div>
      </div>
      {rationale && <p className="who">{rationale}</p>}
      <p className="who">— {author}, {when}</p>
      <div className="mod-actions">
        <button className="btn-ok" disabled={pending} onClick={() => act("APPLY")}>{pick(lang, "Apply edit", "Aplicar edición")}</button>
        <button className="btn-no" disabled={pending} onClick={() => act("REJECT")}>{pick(lang, "Reject", "Rechazar")}</button>
        {error && <span className="mod-err">{error}</span>}
      </div>
    </li>
  );
}

export function MemberRow({
  lang, conference, membershipId, name, email, trustLevel, reputation, isSelf,
}: {
  lang: Lang; conference: string; membershipId: string; name: string; email: string | null;
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
        <span className="mod-body">{name}{isSelf && <span className="pill">{pick(lang, "you", "tú")}</span>}</span>
        {email && <span className="who">{email} · {reputation} rep</span>}
      </div>
      <div className="mod-actions">
        <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="stance-select" disabled={isSelf}>
          {[0, 1, 2, 3, 4].map((l) => (
            <option key={l} value={l}>{trustLabel(lang, l)}</option>
          ))}
        </select>
        <button className="btn-ok" disabled={pending || level === trustLevel || isSelf} onClick={save}>
          {saved ? pick(lang, "Saved", "Guardado") : pick(lang, "Set", "Aplicar")}
        </button>
      </div>
    </li>
  );
}
