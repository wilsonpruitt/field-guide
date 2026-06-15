import { getConference } from "@/lib/conference";
import { pick } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";

// The Book of Discipline glossary, in full. Paragraph references across the
// guide link here (e.g. .../discipline#p604). The corpus is denomination-wide
// (shared across conferences); it renders inside the conference shell so the
// reader keeps their place.
import Community from "@/components/Community";

export default async function DisciplinePage({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), getLang()]);
  const paras = await prisma.bodParagraph.findMany({ orderBy: { number: "asc" } });
  const edition = paras[0]?.edition ?? "2020/2024";

  return (
    <>
      <p className="eyebrow">{pick(lang, "Reference", "Referencia")}</p>
      <h1>{pick(lang, "The Book of Discipline", "El Libro de Disciplina")}</h1>
      <p className="lede">
        {pick(lang, "The paragraphs of ", "Los párrafos de ")}
        <em>{pick(lang, "The Book of Discipline", "El Libro de Disciplina")} {edition}</em>
        {pick(
          lang,
          ` that the guide refers to, in full. References elsewhere in ${conf.name} link here.`,
          ` a los que se refiere la guía, en su totalidad. Las referencias en otras partes de ${conf.name} enlazan aquí.`,
        )}
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
              {pick(lang, "The Book of Discipline", "El Libro de Disciplina")} {p.edition}, ¶{p.number}
              {p.source === "PLENARY"
                ? pick(lang, " · via Plenary", " · vía Plenary")
                : pick(lang, " · scanned supplement", " · suplemento escaneado")}
            </p>
          </li>
        ))}
      </ul>
      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PAGE" targetRef="discipline" />
    </>
  );
}
