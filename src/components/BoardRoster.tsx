// Renders one body's roster. Three shapes carried over from the ac-guide:
//   • by-office  → Office / current-holder table
//   • directory  → names-only list (a prior-year journal source)
//   • nominated  → full table with district/status/etc + election highlight
import Link from "next/link";

const DISTRICT: Record<string, string> = { N: "North", C: "Central", S: "South", RTC: "Conference" };
const STATUS: Record<string, string> = { CL: "Clergy", L: "Lay" };
const RACE: Record<string, string> = {
  "A/A": "African American", AF: "African", ASI: "Asian", E: "Egyptian",
  "H/L": "Hispanic/Latino", NA: "Native American", W: "White",
};
const GENDER: Record<string, string> = { M: "Male", F: "Female", NB: "Non-binary" };

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
  conference,
}: {
  roster: RosterData;
  asOf?: string | null;
  conference: string;
}) {
  const m = roster.members;
  const byOffice = roster.byOffice;
  const detailed = m.some((x) => x.district || x.status || x.gender || x.race);
  const hasPos = m.some((x) => x.position);
  const hasClass = m.some((x) => x.klass);

  if (byOffice) {
    return (
      <section className="roster">
        <div className="roster-head">
          <h2>Members (by office)</h2>
          {roster.source && <span className="py-source">{roster.source}</span>}
        </div>
        <div className="roster-scroll">
          <table className="roster-table">
            <thead><tr><th>Office</th><th>Current holder</th></tr></thead>
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
          <h2>Members</h2>
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
          <p className="py-note-plain">{roster.note ?? "No members on record."}</p>
        )}
        <p className="py-note-plain">
          This body wasn&rsquo;t up for election in {roster.year}, so its members come from the
          conference journal — names only. Verify against a current source.
        </p>
      </section>
    );
  }

  return (
    <section className="roster">
      <div className="roster-head">
        <h2>This year&rsquo;s members</h2>
        <span className="py-source">
          {asOf ? `As of ${asOf} · ` : ""}{roster.year} nominations report
        </span>
      </div>
      {roster.toElect > 0 && (
        <p className="roster-elect">
          <strong>{roster.toElect}</strong> {roster.toElect === 1 ? "seat is" : "seats are"} up for
          election this year — shown <span className="is-nominee-key">highlighted</span> below. See
          the <Link href={`/${conference}/agenda/nominations`}>full slate and how to nominate</Link>.
        </p>
      )}
      <div className="roster-scroll">
        <table className="roster-table">
          <thead>
            <tr>
              <th>Member</th>
              {(hasPos || hasClass) && <th>{hasClass ? "Class" : "Position"}</th>}
              <th>District</th><th>Status</th><th>Gender</th><th>Race / ethnicity</th>
            </tr>
          </thead>
          <tbody>
            {m.map((x) => (
              <tr key={x.orderIndex} className={x.nominee ? "is-nominee" : x.vacant ? "is-vacant" : ""}>
                <td>{x.name}{x.nominee && <span className="tag">up for election</span>}</td>
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
