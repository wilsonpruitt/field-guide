"use client";

import { useMemo, useState } from "react";
import { pick, type Lang } from "@/lib/lang";

export type MotionData = {
  key: string; intent: string; intentEs: string | null; say: string; sayEs: string | null;
  category: "PRIVILEGED" | "SUBSIDIARY" | "INCIDENTAL" | "MAIN" | "BRING_BACK";
  rank: number | null; second: boolean; debatable: boolean; amendable: boolean;
  vote: "MAJORITY" | "TWO_THIRDS" | "NONE"; note: string | null; noteEs: string | null;
};

const GROUPS = [
  { key: "PRIVILEGED", label: "Privileged", labelEs: "Privilegiadas" },
  { key: "SUBSIDIARY", label: "Subsidiary", labelEs: "Subsidiarias" },
  { key: "INCIDENTAL", label: "Incidental", labelEs: "Incidentales" },
  { key: "MAIN", label: "Main", labelEs: "Principales" },
  { key: "BRING_BACK", label: "Bring back", labelEs: "Reabrir" },
] as const;

const voteLabel = (lang: Lang, v: MotionData["vote"]) =>
  v === "TWO_THIRDS"
    ? pick(lang, "Two-thirds vote", "Dos tercios")
    : v === "MAJORITY"
      ? pick(lang, "Majority vote", "Mayoría")
      : pick(lang, "No vote — chair rules", "Sin voto — decide la presidencia");

export default function MotionsHelper({ motions, lang }: { motions: MotionData[]; lang: Lang }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const LABEL: Record<string, string> = Object.fromEntries(
    GROUPS.map((g) => [g.key, pick(lang, g.label, g.labelEs)]),
  );

  const sorted = useMemo(
    () => [...motions].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)),
    [motions],
  );
  const ladder = useMemo(
    () => motions.filter((m) => m.rank !== null).sort((a, b) => a.rank! - b.rank!),
    [motions],
  );

  const query = q.trim().toLowerCase();
  const shown = sorted.filter((m) => {
    const matchCat = cat === "all" || m.category === cat;
    const matchText = query === "" ||
      `${m.intent} ${m.say} ${m.note ?? ""} ${m.intentEs ?? ""} ${m.sayEs ?? ""} ${m.noteEs ?? ""}`.toLowerCase().includes(query);
    return matchCat && matchText;
  });

  return (
    <>
      <div className="helper-controls">
        <input
          className="motion-search"
          type="search"
          placeholder={pick(
            lang,
            "e.g. table, amend, adjourn, end debate…",
            "p. ej. posponer, enmendar, levantar la sesión, cerrar el debate…",
          )}
          autoComplete="off"
          aria-label={pick(
            lang,
            "Search motions by what you want to do",
            "Buscar mociones por lo que quieres hacer",
          )}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chips" role="group" aria-label={pick(lang, "Filter by kind", "Filtrar por tipo")}>
          <button
            className={`chip${cat === "all" ? " is-active" : ""}`}
            aria-pressed={cat === "all"}
            onClick={() => setCat("all")}
          >
            {pick(lang, "All", "Todas")}
          </button>
          {GROUPS.map((g) => (
            <button
              key={g.key}
              className={`chip${cat === g.key ? " is-active" : ""}`}
              aria-pressed={cat === g.key}
              onClick={() => setCat(g.key)}
            >
              {pick(lang, g.label, g.labelEs)}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 && (
        <p className="muted">
          {pick(
            lang,
            "No motion matches that. Try a different word.",
            "Ninguna moción coincide. Prueba con otra palabra.",
          )}
        </p>
      )}

      <ul className="motion-cards">
        {shown.map((m) => (
          <li className="motion-card" key={m.key}>
            <div className="mc-head">
              <h3>{pick(lang, m.intent, m.intentEs)}</h3>
              <span className="pill">
                {LABEL[m.category]}
                {m.rank !== null && ` · #${m.rank}`}
              </span>
            </div>
            <p className="mc-say">“{pick(lang, m.say, m.sayEs)}”</p>
            <ul className="mc-badges">
              <li className={m.second ? "yes" : "no"}>{m.second ? pick(lang, "Needs a second", "Requiere apoyo") : pick(lang, "No second needed", "No requiere apoyo")}</li>
              <li className={m.debatable ? "yes" : "no"}>{m.debatable ? pick(lang, "Debatable", "Debatible") : pick(lang, "Not debatable", "No debatible")}</li>
              <li className={m.amendable ? "yes" : "no"}>{m.amendable ? pick(lang, "Amendable", "Enmendable") : pick(lang, "Not amendable", "No enmendable")}</li>
              <li className="vote">{voteLabel(lang, m.vote)}</li>
            </ul>
            {m.note && <p className="mc-note">{pick(lang, m.note, m.noteEs)}</p>}
          </li>
        ))}
      </ul>

      <section className="ladder">
        <h2>{pick(lang, "Order of precedence", "Orden de precedencia")}</h2>
        <p>
          {pick(
            lang,
            "When more than one motion is pending, a motion higher on this ladder can be made while a lower one is on the floor — not the other way around. (Non-ranking motions aren’t on the ladder; they’re handled when they arise.)",
            "Cuando hay más de una moción pendiente, una moción más alta en esta escala puede hacerse mientras una más baja está sobre la mesa — no al revés. (Las mociones sin rango no están en la escala; se atienden cuando surgen.)",
          )}
        </p>
        <ol className="ladder-list">
          {ladder.map((m) => (
            <li key={m.key}>
              <span className="rank">{m.rank}</span> {pick(lang, m.intent, m.intentEs)}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
