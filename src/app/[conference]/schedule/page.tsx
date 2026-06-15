import Link from "next/link";
import { getConference } from "@/lib/conference";
import { pick, type Lang } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";

type Item = { time: string; title: string; type: string; spine?: string };
type Day = { date: string; label: string; items: Item[] };
type ScheduleData = { title: string; dates: string; days: Day[] };

// Business/voting items are the spine of the day; everything else (worship,
// fellowship, logistics) is context and reads quieter.
const PLENARY = new Set(["business", "voting", "information"]);
const typeLabel = (lang: Lang): Record<string, string> => ({
  business: pick(lang, "Business", "Asuntos"),
  voting: pick(lang, "Vote", "Votación"),
  information: pick(lang, "Q&A", "Preguntas y respuestas"),
  worship: pick(lang, "Worship", "Adoración"),
  fellowship: pick(lang, "Fellowship", "Confraternidad"),
  education: pick(lang, "Teaching", "Enseñanza"),
  break: pick(lang, "Break", "Receso"),
  recognition: pick(lang, "Recognition", "Reconocimiento"),
  closing: pick(lang, "Adjourn", "Clausura"),
  training: pick(lang, "Training", "Capacitación"),
  administrative: pick(lang, "Check-in", "Registro"),
  display: pick(lang, "Display", "Exhibición"),
  preparation: pick(lang, "Prep", "Preparación"),
  entertainment: pick(lang, "Music", "Música"),
});

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), getLang()]);
  const TYPE_LABEL = typeLabel(lang);
  const instance = await prisma.perYearInstance.findFirst({
    where: { conferenceId: conf.id, kind: "SCHEDULE" },
    orderBy: { year: "desc" },
  });

  if (!instance) {
    return (
      <>
        <p className="eyebrow">{pick(lang, "This year", "Este año")}</p>
        <h1>{pick(lang, "Schedule", "Programa")}</h1>
        <p className="muted">
          {pick(
            lang,
            "The schedule for this year hasn’t been published yet.",
            "El programa de este año aún no se ha publicado.",
          )}
        </p>
      </>
    );
  }

  const data = instance.data as ScheduleData;

  return (
    <>
      <p className="eyebrow">{pick(lang, "This year", "Este año")} · {data.dates}</p>
      <h1>{data.title}</h1>
      <p className="lede">
        {pick(
          lang,
          "The full schedule, hour by hour. Business and votes are highlighted — the items that decide something link to the explainer for what they are and how they work.",
          "El programa completo, hora por hora. Los asuntos y las votaciones están destacados — los puntos que deciden algo enlazan al explicador de qué son y cómo funcionan.",
        )}
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

      <p className="py-source" style={{ marginTop: "2rem" }}>{pick(lang, "Source", "Fuente")}: {instance.source}</p>
    </>
  );
}
