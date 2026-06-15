import { getConference } from "@/lib/conference";
import { prisma } from "@/lib/prisma";

// The Book of Discipline glossary, in full. Paragraph references across the
// guide link here (e.g. .../discipline#p604). The corpus is denomination-wide
// (shared across conferences); it renders inside the conference shell so the
// reader keeps their place.
export default async function DisciplinePage({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const paras = await prisma.bodParagraph.findMany({ orderBy: { number: "asc" } });
  const edition = paras[0]?.edition ?? "2020/2024";

  return (
    <>
      <p className="eyebrow">Reference</p>
      <h1>The Book of Discipline</h1>
      <p className="lede">
        The paragraphs of <em>The Book of Discipline {edition}</em> that the guide refers to, in
        full. References elsewhere in {conf.name} link here.
      </p>

      <ul className="bod-list">
        {paras.map((p) => (
          <li key={p.number} id={`p${p.number}`} className="bod-entry">
            <p className="bod-head">
              ¶{p.number}
              {p.title ? ` · ${p.title}` : ""}
            </p>
            <p className="bod-text">{p.fullText ?? p.excerpt}</p>
            <p className="bod-src">
              The Book of Discipline {p.edition}, ¶{p.number}
              {p.source === "PLENARY" ? " · via Plenary" : " · scanned supplement"}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
