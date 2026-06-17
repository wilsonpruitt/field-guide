// Renders Book of Discipline paragraph references with a hover/focus popover
// carrying the paragraph title + excerpt. Refs not in the corpus render as plain
// text. `paras` is a number→entry map the page builds once from BodParagraph.
import { Fragment } from "react";
import { pick, type Lang } from "@/lib/lang";

export type BodPara = { number: number; title: string | null; titleEs?: string | null; excerpt: string; excerptEs?: string | null; source: string };

function parse(ref: string, paras: Record<string, BodPara>) {
  const m = ref.match(/(\d+)/);
  const base = m ? m[1] : null;
  const entry = base && paras[base] ? paras[base] : null;
  return { label: ref, entry, range: /[-–]/.test(ref) };
}

export default function BodRefs({
  refs,
  paras,
  pill = false,
  disciplineBase,
  lang = "en",
}: {
  refs: string[];
  paras: Record<string, BodPara>;
  pill?: boolean;
  /** e.g. "/riotexas/discipline" — when set, refs link to the full paragraph. */
  disciplineBase?: string;
  lang?: Lang;
}) {
  const items = refs.map((r) => parse(r, paras));
  return (
    <span className={pill ? "bodrefs pill" : "bodrefs"}>
      {items.map((it, i) => (
        <Fragment key={i}>
          {it.entry ? (
            <span className="bodref" tabIndex={0}>
              {disciplineBase ? (
                <a href={`${disciplineBase}#p${it.entry.number}`}>{it.label}</a>
              ) : (
                it.label
              )}
              <span className="bodref-pop" role="tooltip">
                <span className="bp-num">
                  ¶{it.entry.number}
                  {it.range ? " ff." : ""}
                  {it.entry.title || it.entry.titleEs ? ` · ${pick(lang, it.entry.title ?? "", it.entry.titleEs) || it.entry.title}` : ""}
                </span>
                <span className="bp-body">{pick(lang, it.entry.excerpt, it.entry.excerptEs)}</span>
                <span className="bp-src">
                  The Book of Discipline 2020/2024, ¶{it.entry.number}
                  {it.entry.source === "PLENARY" ? pick(lang, " · via Plenary", " · vía Plenary") : ""}
                </span>
                {disciplineBase && (
                  <a className="bp-more" href={`${disciplineBase}#p${it.entry.number}`}>
                    {pick(lang, `Read ¶${it.entry.number} in full →`, `Leer ¶${it.entry.number} completo →`)}
                  </a>
                )}
              </span>
            </span>
          ) : (
            <span className="bodref is-plain">{it.label}</span>
          )}
          {i < items.length - 1 ? ", " : ""}
        </Fragment>
      ))}
    </span>
  );
}
