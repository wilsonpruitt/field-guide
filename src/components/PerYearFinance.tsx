// The live finance data plate — mirrored from the Río Texas Atlas. Renders the
// latest audited year plus a year-by-year trend. No fabrication: a collection
// rate shows only when the journal-sourced apportionment ask is present.
const ATLAS = "https://riotexas.wrootlabs.com/conference";

export type FinanceRow = {
  data_year: number; source?: string; apportionment_rev?: number; total_rev?: number;
  total_exp?: number; net_assets_eoy?: number; apportionment_ask?: number;
  collection_rate?: number; preliminary?: boolean;
};

const usd = (n?: number) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(0)}%`;

export default function PerYearFinance({ rows: input }: { rows: FinanceRow[] }) {
  const rows = [...input].sort((a, b) => a.data_year - b.data_year);
  const latest = rows.at(-1);
  const first = rows[0];
  if (!latest) return null;

  const apportDrop =
    latest.apportionment_rev != null && first?.apportionment_rev
      ? ((latest.apportionment_rev - first.apportionment_rev) / first.apportionment_rev) * 100
      : null;
  const collectionRate =
    latest.collection_rate ??
    (latest.apportionment_ask && latest.apportionment_rev
      ? (latest.apportionment_rev / latest.apportionment_ask) * 100
      : null);

  return (
    <section className="per-year">
      <div className="py-head">
        <h2>What&rsquo;s up this year</h2>
        <span className="py-source">
          Audited figures · {latest.data_year} · <a href={ATLAS}>via the Atlas</a>
        </span>
      </div>

      <div className="py-stats">
        <a className="stat" href={ATLAS}>
          <span className="stat-label">Apportionment received</span>
          <span className="stat-value">{usd(latest.apportionment_rev)}</span>
          {apportDrop != null && first && (
            <span className="stat-sub">{pct(apportDrop)} since {first.data_year}</span>
          )}
        </a>
        {collectionRate != null && (
          <a className="stat" href={ATLAS}>
            <span className="stat-label">Collection rate</span>
            <span className="stat-value">{collectionRate.toFixed(1)}%</span>
            <span className="stat-sub">of {usd(latest.apportionment_ask)} apportioned, all funds</span>
          </a>
        )}
        <a className="stat" href={ATLAS}>
          <span className="stat-label">Total revenue</span>
          <span className="stat-value">{usd(latest.total_rev)}</span>
        </a>
        <a className="stat" href={ATLAS}>
          <span className="stat-label">Total expenses</span>
          <span className="stat-value">{usd(latest.total_exp)}</span>
        </a>
        <a className="stat" href={ATLAS}>
          <span className="stat-label">Net assets, year end</span>
          <span className="stat-value">{usd(latest.net_assets_eoy)}</span>
        </a>
      </div>

      {latest.preliminary && (
        <p className="py-note">
          {latest.data_year} revenue figures are <strong>preliminary</strong> (pre-final audit); the
          collection rate is from the CF&amp;A report.
        </p>
      )}

      <details className="py-trend">
        <summary>
          Apportionment received &amp; collection rate, {first?.data_year}–{latest.data_year}
        </summary>
        <table>
          <thead>
            <tr><th>Year</th><th>Received</th><th>vs. prior</th><th>Collected</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const prev = rows[i - 1]?.apportionment_rev;
              const yoy = prev && r.apportionment_rev != null
                ? ((r.apportionment_rev - prev) / prev) * 100 : null;
              return (
                <tr key={r.data_year}>
                  <td>{r.data_year}</td>
                  <td>{usd(r.apportionment_rev)}</td>
                  <td className={yoy != null && yoy < 0 ? "down" : "up"}>{yoy != null ? pct(yoy) : "—"}</td>
                  <td>{r.collection_rate != null ? `${r.collection_rate.toFixed(1)}%` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="py-source">
          Collection rate is CF&amp;A&rsquo;s stated share on all funds. Full interactive revenue
          view, including the inflation-pegged baseline, on <a href={ATLAS}>the Atlas →</a>
        </p>
      </details>
    </section>
  );
}
