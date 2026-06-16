// Renders one body's roster. Three shapes carried over from the ac-guide:
//   • by-office  → Office / current-holder table
//   • directory  → names-only list (a prior-year journal source)
//   • nominated  → full table with district/status/etc + election highlight
import Link from "next/link";
import { pick, type Lang } from "@/lib/lang";

const DISTRICT_EN: Record<string, string> = { N: "North", C: "Central", S: "South", RTC: "Conference" };
const DISTRICT_ES: Record<string, string> = { N: "Norte", C: "Central", S: "Sur", RTC: "Conferencia" };
const STATUS_EN: Record<string, string> = { CL: "Clergy", L: "Lay" };
const STATUS_ES: Record<string, string> = { CL: "Clero", L: "Laico" };
const RACE: Record<string, string> = {
  "A/A": "African American", AF: "African", ASI: "Asian", E: "Egyptian",
  "H/L": "Hispanic/Latino", NA: "Native American", W: "White",
};
const GENDER_EN: Record<string, string> = { M: "Male", F: "Female", NB: "Non-binary" };
const GENDER_ES: Record<string, string> = { M: "Masculino", F: "Femenino", NB: "No binario" };

export type Member = {
  orderIndex: number; name: string; position: string | null; klass: string | null;
  district: string | null; status: string | null; gender: string | null; race: string | null;
  office: string | null; holder: string | null; nominee: boolean; vacant: boolean; note: string | null;
};
export type RosterData = {
  bodySlug: string; year: number; source: string; toElect: number; byOffice: boolean;
  note: string | null; members: Member[];
};

export default function BoardRoster({
  roster,
  asOf,
  base,
  lang,
}: {
  roster: RosterData;
  asOf?: string | null;
  base: string;
  lang: Lang;
}) {
  const m = roster.members;
  const byOffice = roster.byOffice;
  const detailed = m.some((x) => x.district || x.status || x.gender || x.race);
  const hasPos = m.some((x) => x.position);
  const hasClass = m.some((x) => x.klass);
  const DISTRICT = pick(lang, DISTRICT_EN, DISTRICT_ES);
  const STATUS = pick(lang, STATUS_EN, STATUS_ES);
  const GENDER = pick(lang, GENDER_EN, GENDER_ES);

  if (byOffice) {
    return (
      <section className="roster">
        <div className="roster-head">
          <h2>{pick(lang, "Members (by office)", "Miembros (por cargo)")}</h2>
          {roster.source && <span className="py-source">{roster.source}</span>}
        </div>
        <div className="roster-scroll">
          <table className="roster-table">
            <thead><tr><th>{pick(lang, "Office", "Cargo")}</th><th>{pick(lang, "Current holder", "Titular actual")}</th></tr></thead>
            <tbody>
              {m.map((x) => (
                <tr key={x.orderIndex}>
                  <td>{x.office ?? x.position ?? "—"}</td>
                  <td>{x.holder ?? <span className="muted">{x.note ?? "—"}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {roster.note && <p className="py-note-plain">{roster.note}</p>}
      </section>
    );
  }

  if (!detailed) {
    return (
      <section className="roster">
        <div className="roster-head">
          <h2>{pick(lang, "Members", "Miembros")}</h2>
          <span className="py-source">{roster.source}</span>
        </div>
        {m.length > 0 ? (
          <ul className="roster-names">
            {m.map((x) => (
              <li key={x.orderIndex}>
                {x.name}
                {x.position && <span className="role">{x.position}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-note-plain">{roster.note ?? pick(lang, "No members on record.", "No hay miembros registrados.")}</p>
        )}
        <p className="py-note-plain">
          {pick(
            lang,
            <>This body wasn&rsquo;t up for election in {roster.year}, so its members come from the conference journal — names only. Verify against a current source.</>,
            <>Este cuerpo no estuvo en elección en {roster.year}, así que sus miembros provienen del diario de la conferencia — solo nombres. Verifique con una fuente actual.</>,
          )}
        </p>
      </section>
    );
  }

  return (
    <section className="roster">
      <div className="roster-head">
        <h2>{pick(lang, "This year’s members", "Miembros de este año")}</h2>
        <span className="py-source">
          {asOf ? pick(lang, `As of ${asOf} · `, `Al ${asOf} · `) : ""}{pick(lang, `${roster.year} nominations report`, `informe de nominaciones de ${roster.year}`)}
        </span>
      </div>
      {roster.toElect > 0 && (
        <p className="roster-elect">
          {pick(
            lang,
            <>
              <strong>{roster.toElect}</strong> {roster.toElect === 1 ? "seat is" : "seats are"} up for
              election this year — shown <span className="is-nominee-key">highlighted</span> below. See
              the <Link href={`${base}/agenda/nominations`}>full slate and how to nominate</Link>.
            </>,
            <>
              <strong>{roster.toElect}</strong> {roster.toElect === 1 ? "cargo está" : "cargos están"} en
              elección este año — se muestran <span className="is-nominee-key">resaltados</span> abajo. Vea
              la <Link href={`${base}/agenda/nominations`}>lista completa y cómo nominar</Link>.
            </>,
          )}
        </p>
      )}
      <div className="roster-scroll">
        <table className="roster-table">
          <thead>
            <tr>
              <th>{pick(lang, "Member", "Miembro")}</th>
              {(hasPos || hasClass) && <th>{hasClass ? pick(lang, "Class", "Clase") : pick(lang, "Position", "Cargo")}</th>}
              <th>{pick(lang, "District", "Distrito")}</th><th>{pick(lang, "Status", "Estatus")}</th><th>{pick(lang, "Gender", "Género")}</th><th>{pick(lang, "Race / ethnicity", "Raza o etnia")}</th>
            </tr>
          </thead>
          <tbody>
            {m.map((x) => (
              <tr key={x.orderIndex} className={x.nominee ? "is-nominee" : x.vacant ? "is-vacant" : ""}>
                <td>{x.name}{x.nominee && <span className="tag">{pick(lang, "up for election", "en elección")}</span>}</td>
                {(hasPos || hasClass) && <td>{x.klass ?? x.position ?? ""}</td>}
                <td>{x.vacant ? "—" : DISTRICT[x.district ?? ""] ?? x.district ?? "—"}</td>
                <td>{x.vacant ? "—" : STATUS[x.status ?? ""] ?? x.status ?? "—"}</td>
                <td>{x.vacant ? "—" : GENDER[x.gender ?? ""] ?? x.gender ?? "—"}</td>
                <td>{x.vacant ? "—" : RACE[x.race ?? ""] ?? x.race ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
