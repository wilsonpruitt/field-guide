import type { Lang } from "@/lib/lang";

/**
 * Renders the "Source" line for a report/body/agenda/process item, and — when
 * the conference has a hosted handbook PDF and the item carries a 1-based
 * `sourcePage` — turns the page reference into a deep-link that opens the PDF
 * jumped to that page (`{handbookUrl}#page=N`, the browser-native anchor).
 */
export default function HandbookCite({
  source,
  page,
  handbookUrl,
  handbookLabel,
  lang,
}: {
  source?: string | null;
  page?: number | null;
  handbookUrl?: string | null;
  handbookLabel?: string | null;
  lang: Lang;
}) {
  if (!source && !page) return null;
  const es = lang === "es";
  const label = es ? "Fuente" : "Source";
  const pageWord = es ? "pág." : "p.";

  const pageRef =
    page != null ? (
      handbookUrl ? (
        <a
          href={`${handbookUrl}#page=${page}`}
          target="_blank"
          rel="noopener noreferrer"
          className="handbook-cite"
          title={handbookLabel ?? undefined}
        >
          {pageWord} {page} ↗
        </a>
      ) : (
        <span>{pageWord} {page}</span>
      )
    ) : null;

  return (
    <p className="py-source">
      {label}: {source}
      {source && pageRef ? " · " : null}
      {pageRef}
    </p>
  );
}
