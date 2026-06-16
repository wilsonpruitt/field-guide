// This year's election slate + conference-wide diversity scan, from the
// Committee on Nominations report. `boards` is paired with body names/slugs by
// the page so each row links to the body.
import Link from "next/link";
import { pick, type Lang } from "@/lib/lang";

type Election = {
  total_to_elect: number; slate_presented: string; substitution_deadline: string;
  ratification: string; note: string;
};
type Scan = {
  note: string; status: string[][]; gender: string[][]; district: string[][]; race: string[][];
};
export type NominationsData = { election: Election; diversity_scan: Scan; as_of?: string };
export type SlateBoard = { slug: string; name: string; toElect: number; nominees: string[] };

export default function NominationsSlate({
  data,
  boards,
  source,
  base,
  lang,
}: {
  data: NominationsData;
  boards: SlateBoard[];
  source: string;
  base: string;
  lang: Lang;
}) {
  const e = data.election;
  const ds = data.diversity_scan;
  const withSeats = boards.filter((b) => b.toElect > 0).length;

  return (
    <section className="per-year">
      <div className="py-head">
        <h2>{pick(lang, "This year’s slate", "La lista de este año")}</h2>
        <span className="py-source">{source}</span>
      </div>

      <div className="py-stats">
        <div className="stat">
          <span className="stat-label">{pick(lang, "Seats up for election", "Cargos en elección")}</span>
          <span className="stat-value">{e.total_to_elect}</span>
          <span className="stat-sub">{pick(lang, `across ${withSeats} boards`, `en ${withSeats} juntas`)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">{pick(lang, "Slate presented", "Lista presentada")}</span>
          <span className="stat-value" style={{ fontSize: "1.05rem" }}>{e.slate_presented}</span>
          <span className="stat-sub">{pick(lang, `substitutions by ${e.substitution_deadline}`, `sustituciones antes del ${e.substitution_deadline}`)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">{pick(lang, "Ratified", "Ratificada")}</span>
          <span className="stat-value" style={{ fontSize: "1.05rem" }}>{e.ratification}</span>
          <span className="stat-sub">{pick(lang, "including floor substitutions", "incluidas las sustituciones desde el pleno")}</span>
        </div>
      </div>

      <p className="py-note-plain">{e.note}</p>

      <div className="roster-scroll">
        <table className="roster-table slate-table">
          <thead>
            <tr><th>{pick(lang, "Board", "Junta")}</th><th>{pick(lang, "Seats", "Cargos")}</th><th>{pick(lang, "Proposed nominees", "Candidatos propuestos")}</th></tr>
          </thead>
          <tbody>
            {boards.map((b) => (
              <tr key={b.slug}>
                <td><Link href={`${base}/agencies/${b.slug}`}>{b.name}</Link></td>
                <td>{b.toElect}</td>
                <td>{b.nominees.length ? b.nominees.join(", ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="py-trend">
        <summary>{pick(lang, "Conference-wide diversity scan (pre-election)", "Panorama de diversidad de la conferencia (pre-elección)")}</summary>
        <p className="py-source">{ds.note}</p>
        <div className="scan-grid">
          {([
            [pick(lang, "Status", "Estatus"), ds.status],
            [pick(lang, "Gender", "Género"), ds.gender],
            [pick(lang, "District", "Distrito"), ds.district],
            [pick(lang, "Race / ethnicity", "Raza o etnia"), ds.race],
          ] as [string, string[][]][]).map(
            ([label, rows]) => (
              <table className="roster-table" key={label}>
                <thead><tr><th>{label}</th><th>{pick(lang, "No. / total", "No. / total")}</th><th>%</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>
                  ))}
                </tbody>
              </table>
            ),
          )}
        </div>
      </details>
    </section>
  );
}
