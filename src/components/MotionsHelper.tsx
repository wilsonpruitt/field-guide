"use client";

import { useMemo, useState } from "react";

export type MotionData = {
  key: string; intent: string; say: string;
  category: "PRIVILEGED" | "SUBSIDIARY" | "INCIDENTAL" | "MAIN" | "BRING_BACK";
  rank: number | null; second: boolean; debatable: boolean; amendable: boolean;
  vote: "MAJORITY" | "TWO_THIRDS" | "NONE"; note: string | null;
};

const GROUPS = [
  { key: "PRIVILEGED", label: "Privileged" },
  { key: "SUBSIDIARY", label: "Subsidiary" },
  { key: "INCIDENTAL", label: "Incidental" },
  { key: "MAIN", label: "Main" },
  { key: "BRING_BACK", label: "Bring back" },
] as const;
const LABEL: Record<string, string> = Object.fromEntries(GROUPS.map((g) => [g.key, g.label]));

const voteLabel = (v: MotionData["vote"]) =>
  v === "TWO_THIRDS" ? "Two-thirds vote" : v === "MAJORITY" ? "Majority vote" : "No vote — chair rules";

export default function MotionsHelper({ motions }: { motions: MotionData[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

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
    const matchText = query === "" || `${m.intent} ${m.say} ${m.note ?? ""}`.toLowerCase().includes(query);
    return matchCat && matchText;
  });

  return (
    <>
      <div className="helper-controls">
        <input
          className="motion-search"
          type="search"
          placeholder="e.g. table, amend, adjourn, end debate…"
          autoComplete="off"
          aria-label="Search motions by what you want to do"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chips" role="group" aria-label="Filter by kind">
          <button
            className={`chip${cat === "all" ? " is-active" : ""}`}
            aria-pressed={cat === "all"}
            onClick={() => setCat("all")}
          >
            All
          </button>
          {GROUPS.map((g) => (
            <button
              key={g.key}
              className={`chip${cat === g.key ? " is-active" : ""}`}
              aria-pressed={cat === g.key}
              onClick={() => setCat(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 && <p className="muted">No motion matches that. Try a different word.</p>}

      <ul className="motion-cards">
        {shown.map((m) => (
          <li className="motion-card" key={m.key}>
            <div className="mc-head">
              <h3>{m.intent}</h3>
              <span className="pill">
                {LABEL[m.category]}
                {m.rank !== null && ` · #${m.rank}`}
              </span>
            </div>
            <p className="mc-say">“{m.say}”</p>
            <ul className="mc-badges">
              <li className={m.second ? "yes" : "no"}>{m.second ? "Needs a second" : "No second needed"}</li>
              <li className={m.debatable ? "yes" : "no"}>{m.debatable ? "Debatable" : "Not debatable"}</li>
              <li className={m.amendable ? "yes" : "no"}>{m.amendable ? "Amendable" : "Not amendable"}</li>
              <li className="vote">{voteLabel(m.vote)}</li>
            </ul>
            {m.note && <p className="mc-note">{m.note}</p>}
          </li>
        ))}
      </ul>

      <section className="ladder">
        <h2>Order of precedence</h2>
        <p>
          When more than one motion is pending, a motion higher on this ladder can be made while a
          lower one is on the floor — not the other way around. (Non-ranking motions aren&rsquo;t on
          the ladder; they&rsquo;re handled when they arise.)
        </p>
        <ol className="ladder-list">
          {ladder.map((m) => (
            <li key={m.key}>
              <span className="rank">{m.rank}</span> {m.intent}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
