// Renders Book of Discipline paragraph references with a hover/focus popover
// carrying the paragraph title + excerpt. Refs not in the corpus render as plain
// text. `paras` is a number→entry map the page builds once from BodParagraph.
import { Fragment } from "react";

export type BodPara = { number: number; title: string | null; excerpt: string; source: string };

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
}: {
  refs: string[];
  paras: Record<string, BodPara>;
  pill?: boolean;
}) {
  const items = refs.map((r) => parse(r, paras));
  return (
    <span className={pill ? "bodrefs pill" : "bodrefs"}>
      {items.map((it, i) => (
        <Fragment key={i}>
          {it.entry ? (
            <span className="bodref" tabIndex={0}>
              {it.label}
              <span className="bodref-pop" role="tooltip">
                <span className="bp-num">
                  ¶{it.entry.number}
                  {it.range ? " ff." : ""}
                  {it.entry.title ? ` · ${it.entry.title}` : ""}
                </span>
                <span className="bp-body">{it.entry.excerpt}</span>
                <span className="bp-src">
                  The Book of Discipline 2020/2024, ¶{it.entry.number}
                  {it.entry.source === "PLENARY" ? " · via Plenary" : ""}
                </span>
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
