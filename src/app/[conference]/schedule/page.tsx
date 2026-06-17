import Link from "next/link";
import { getConference } from "@/lib/conference";
import { linkBase } from "@/lib/host";
import { pick, type Lang } from "@/lib/lang";
import { langFor } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";

type Item = { time: string; title: string; type: string; spine?: string; note?: string; noteEs?: string };
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

// Baseline "what is this?" text by type, for items that don't link to their own
// section of the guide. An item's own `note` (below) overrides this when set.
const typeExplain = (lang: Lang): Record<string, string> => ({
  business: pick(
    lang,
    "An item of conference business — a report, presentation, or proposal brought before the body. It may simply be received, or it may lead to a vote.",
    "Un asunto de la conferencia — un informe, presentación o propuesta ante el cuerpo. Puede solo recibirse, o llevar a una votación.",
  ),
  voting: pick(
    lang,
    "The body votes on this item. Every clergy and lay member seated at the conference may cast a vote.",
    "El cuerpo vota sobre este punto. Cada miembro clérigo y laico con asiento en la conferencia puede votar.",
  ),
  information: pick(
    lang,
    "A time for questions and answers — no vote is taken, but you can learn how something works before it comes to the floor.",
    "Un tiempo de preguntas y respuestas — no hay votación, pero puede entender cómo funciona algo antes de que llegue al pleno.",
  ),
  worship: pick(
    lang,
    "A service of worship — singing, prayer, and proclamation. All are welcome.",
    "Un culto de adoración — canto, oración y proclamación. Todos son bienvenidos.",
  ),
  fellowship: pick(
    lang,
    "An informal gathering — a meal or reception for connecting with others. Usually open to those invited rather than part of the formal business.",
    "Una reunión informal — una comida o recepción para convivir. Normalmente abierta a los invitados, fuera de los asuntos formales.",
  ),
  education: pick(
    lang,
    "A teaching session — learning together on a theme, set apart from the formal business of the conference.",
    "Una sesión de enseñanza — aprender juntos sobre un tema, aparte de los asuntos formales de la conferencia.",
  ),
  break: pick(
    lang,
    "A scheduled pause in the proceedings.",
    "Una pausa programada en las sesiones.",
  ),
  recognition: pick(
    lang,
    "A moment to honor people or ministries for their service.",
    "Un momento para honrar a personas o ministerios por su servicio.",
  ),
  closing: pick(
    lang,
    "The formal close of the session, ending the conference's work.",
    "El cierre formal de la sesión, concluyendo el trabajo de la conferencia.",
  ),
  training: pick(
    lang,
    "A workshop or training session for a particular group or role.",
    "Un taller o capacitación para un grupo o función en particular.",
  ),
  administrative: pick(
    lang,
    "Logistics — members register, confirm their seating, and pick up materials and voting credentials.",
    "Logística — los miembros se registran, confirman su asiento y recogen materiales y credenciales de votación.",
  ),
  display: pick(
    lang,
    "An area or exhibit open for browsing during the conference.",
    "Un área o exhibición abierta para recorrer durante la conferencia.",
  ),
  preparation: pick(
    lang,
    "Setup or rehearsal ahead of a service or event.",
    "Preparación o ensayo antes de un culto o evento.",
  ),
  entertainment: pick(
    lang,
    "A musical or cultural performance.",
    "Una presentación musical o cultural.",
  ),
});

import Community from "@/components/Community";
import ScheduleNote from "@/components/ScheduleNote";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), langFor(conference)]);
  const base = await linkBase(conf.slug);
  const TYPE_LABEL = typeLabel(lang);
  const TYPE_EXPLAIN = typeExplain(lang);
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
              const explain = (pick(lang, it.note ?? "", it.noteEs) || TYPE_EXPLAIN[it.type] || "").trim();
              return (
                <li key={i} className={`sched-item${plenary ? " is-plenary" : ""}${it.type === "voting" ? " is-vote" : ""}`}>
                  <span className="sched-time">{it.time}</span>
                  <span className="sched-body">
                    <span className="sched-title">
                      {it.spine ? (
                        <Link href={`${base}/${it.spine}`}>{it.title}</Link>
                      ) : explain ? (
                        <ScheduleNote
                          title={it.title}
                          category={TYPE_LABEL[it.type] ?? it.type}
                          body={explain}
                        />
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
      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PAGE" targetRef="schedule" />
    </>
  );
}
