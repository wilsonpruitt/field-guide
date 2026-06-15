import Link from "next/link";
import { getConference } from "@/lib/conference";
import { prisma } from "@/lib/prisma";

type Item = { time: string; title: string; type: string; spine?: string };
type Day = { date: string; label: string; items: Item[] };
type ScheduleData = { title: string; dates: string; days: Day[] };

// Business/voting items are the spine of the day; everything else (worship,
// fellowship, logistics) is context and reads quieter.
const PLENARY = new Set(["business", "voting", "information"]);
const TYPE_LABEL: Record<string, string> = {
  business: "Business", voting: "Vote", information: "Q&A", worship: "Worship",
  fellowship: "Fellowship", education: "Teaching", break: "Break", recognition: "Recognition",
  closing: "Adjourn", training: "Training", administrative: "Check-in", display: "Display",
  preparation: "Prep", entertainment: "Music",
};

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const instance = await prisma.perYearInstance.findFirst({
    where: { conferenceId: conf.id, kind: "SCHEDULE" },
    orderBy: { year: "desc" },
  });

  if (!instance) {
    return (
      <>
        <p className="eyebrow">This year</p>
        <h1>Schedule</h1>
        <p className="muted">The schedule for this year hasn&rsquo;t been published yet.</p>
      </>
    );
  }

  const data = instance.data as ScheduleData;

  return (
    <>
      <p className="eyebrow">This year · {data.dates}</p>
      <h1>{data.title}</h1>
      <p className="lede">
        The full schedule, hour by hour. Business and votes are highlighted — the items that decide
        something link to the explainer for what they are and how they work.
      </p>

      {data.days.map((day) => (
        <section key={day.date} className="sched-day">
          <h2>{day.label}</h2>
          <ul className="sched">
            {day.items.map((it, i) => {
              const plenary = PLENARY.has(it.type);
              return (
                <li key={i} className={`sched-item${plenary ? " is-plenary" : ""}${it.type === "voting" ? " is-vote" : ""}`}>
                  <span className="sched-time">{it.time}</span>
                  <span className="sched-body">
                    <span className="sched-title">
                      {it.spine ? (
                        <Link href={`/${conf.slug}/${it.spine}`}>{it.title}</Link>
                      ) : (
                        it.title
                      )}
                    </span>
                    <span className={`sched-tag t-${it.type}`}>{TYPE_LABEL[it.type] ?? it.type}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="py-source" style={{ marginTop: "2rem" }}>Source: {instance.source}</p>
    </>
  );
}
