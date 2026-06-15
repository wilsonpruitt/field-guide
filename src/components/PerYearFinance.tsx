// The live finance data plate — mirrored from the conference's Atlas when it has
// one. No fabrication: a collection rate shows only when the apportionment ask
// is present, and Atlas links appear only for conferences with an Atlas.
import { pick, type Lang } from "@/lib/lang";

export type FinanceRow = {
  data_year: number; source?: string; apportionment_rev?: number; total_rev?: number;
  total_exp?: number; net_assets_eoy?: number; apportionment_ask?: number;
  collection_rate?: number; preliminary?: boolean;
};

const usd = (n?: number) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(0)}%`;

export default function PerYearFinance({
  rows: input,
  lang,
  atlasUrl,
}: {
  rows: FinanceRow[];
  lang: Lang;
  /** When set, the stat cards and trend link to the conference's Atlas. */
  atlasUrl?: string;
}) {
  const rows = [...input].sort((a, b) => a.data_year - b.data_year);
  const latest = rows.at(-1);
  const first = rows[0];
  if (!latest) return null;

  // A stat card links to the Atlas only when the conference has one.
  const Stat = ({ children }: { children: React.ReactNode }) =>
    atlasUrl ? (
      <a className="stat" href={atlasUrl}>{children}</a>
    ) : (
      <div className="stat">{children}</div>
    );

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
        <h2>{pick(lang, "What’s up this year", "Lo destacado este año")}</h2>
        <span className="py-source">
          {pick(lang, "Audited figures", "Cifras auditadas")} · {latest.data_year}
          {atlasUrl && <> · <a href={atlasUrl}>{pick(lang, "via the Atlas", "vía el Atlas")}</a></>}
        </span>
      </div>

      <div className="py-stats">
        <Stat>
          <span className="stat-label">{pick(lang, "Apportionment received", "Prorrateo recibido")}</span>
          <span className="stat-value">{usd(latest.apportionment_rev)}</span>
          {apportDrop != null && first && (
            <span className="stat-sub">{pct(apportDrop)} {pick(lang, "since", "desde")} {first.data_year}</span>
          )}
        </Stat>
        {collectionRate != null && (
          <Stat>
            <span className="stat-label">{pick(lang, "Collection rate", "Tasa de recaudación")}</span>
            <span className="stat-value">{collectionRate.toFixed(1)}%</span>
            <span className="stat-sub">{pick(lang, `of ${usd(latest.apportionment_ask)} apportioned, all funds`, `de ${usd(latest.apportionment_ask)} prorrateado, todos los fondos`)}</span>
          </Stat>
        )}
        <Stat>
          <span className="stat-label">{pick(lang, "Total revenue", "Ingresos totales")}</span>
          <span className="stat-value">{usd(latest.total_rev)}</span>
        </Stat>
        <Stat>
          <span className="stat-label">{pick(lang, "Total expenses", "Gastos totales")}</span>
          <span className="stat-value">{usd(latest.total_exp)}</span>
        </Stat>
        <Stat>
          <span className="stat-label">{pick(lang, "Net assets, year end", "Activos netos, fin de año")}</span>
          <span className="stat-value">{usd(latest.net_assets_eoy)}</span>
        </Stat>
      </div>

      {latest.preliminary && (
        <p className="py-note">
          {pick(
            lang,
            <>{latest.data_year} figures are <strong>preliminary</strong> (pre-final audit); the collection rate is from the CF&amp;A report.</>,
            <>Las cifras de {latest.data_year} son <strong>preliminares</strong> (antes de la auditoría final); la tasa de recaudación proviene del informe de la CF&amp;A.</>,
          )}
        </p>
      )}

      <details className="py-trend">
        <summary>
          {pick(lang, "Apportionment received & collection rate", "Prorrateo recibido y tasa de recaudación")}, {first?.data_year}–{latest.data_year}
        </summary>
        <table>
          <thead>
            <tr><th>{pick(lang, "Year", "Año")}</th><th>{pick(lang, "Received", "Recibido")}</th><th>{pick(lang, "vs. prior", "vs. anterior")}</th><th>{pick(lang, "Collected", "Recaudado")}</th></tr>
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
          {pick(
            lang,
            <>Collection rate is CF&amp;A&rsquo;s stated share on all funds.{atlasUrl && <> Full interactive revenue view, including the inflation-pegged baseline, on <a href={atlasUrl}>the Atlas →</a></>}</>,
            <>La tasa de recaudación es la proporción declarada por la CF&amp;A sobre todos los fondos.{atlasUrl && <> Vista interactiva completa de ingresos, incluida la base ajustada por inflación, en <a href={atlasUrl}>el Atlas →</a></>}</>,
          )}
        </p>
      </details>
    </section>
  );
}
