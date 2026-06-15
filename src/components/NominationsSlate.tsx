// This year's election slate + conference-wide diversity scan, from the
// Committee on Nominations report. `boards` is paired with body names/slugs by
// the page so each row links to the body.
import Link from "next/link";

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
  conference,
}: {
  data: NominationsData;
  boards: SlateBoard[];
  source: string;
  conference: string;
}) {
  const e = data.election;
  const ds = data.diversity_scan;
  const withSeats = boards.filter((b) => b.toElect > 0).length;

  return (
    <section className="per-year">
      <div className="py-head">
        <h2>This year&rsquo;s slate</h2>
        <span className="py-source">{source}</span>
      </div>

      <div className="py-stats">
        <div className="stat">
          <span className="stat-label">Seats up for election</span>
          <span className="stat-value">{e.total_to_elect}</span>
          <span className="stat-sub">across {withSeats} boards</span>
        </div>
        <div className="stat">
          <span className="stat-label">Slate presented</span>
          <span className="stat-value" style={{ fontSize: "1.05rem" }}>{e.slate_presented}</span>
          <span className="stat-sub">substitutions by {e.substitution_deadline}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Ratified</span>
          <span className="stat-value" style={{ fontSize: "1.05rem" }}>{e.ratification}</span>
          <span className="stat-sub">including floor substitutions</span>
        </div>
      </div>

      <p className="py-note-plain">{e.note}</p>

      <div className="roster-scroll">
        <table className="roster-table slate-table">
          <thead>
            <tr><th>Board</th><th>Seats</th><th>Proposed nominees</th></tr>
          </thead>
          <tbody>
            {boards.map((b) => (
              <tr key={b.slug}>
                <td><Link href={`/${conference}/agencies/${b.slug}`}>{b.name}</Link></td>
                <td>{b.toElect}</td>
                <td>{b.nominees.length ? b.nominees.join(", ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="py-trend">
        <summary>Conference-wide diversity scan (pre-election)</summary>
        <p className="py-source">{ds.note}</p>
        <div className="scan-grid">
          {([["Status", ds.status], ["Gender", ds.gender], ["District", ds.district], ["Race / ethnicity", ds.race]] as [string, string[][]][]).map(
            ([label, rows]) => (
              <table className="roster-table" key={label}>
                <thead><tr><th>{label}</th><th>No. / total</th><th>%</th></tr></thead>
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
