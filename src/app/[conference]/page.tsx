import Link from "next/link";
import { getConference } from "@/lib/conference";
import { pick } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

import Community from "@/components/Community";

export default async function ConferenceHome({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), getLang()]);
  const base = `/${conf.slug}`;

  const cards = [
    {
      href: `${base}/schedule`,
      title: pick(lang, "This year's schedule", "El programa de este año"),
      blurb: pick(
        lang,
        "The full timeline, hour by hour — with the business and votes highlighted.",
        "El cronograma completo, hora por hora — con los asuntos y las votaciones destacados.",
      ),
    },
    {
      href: `${base}/actions`,
      title: pick(lang, "Up for a vote", "Para votación"),
      blurb: pick(
        lang,
        "The reports and resolutions conference is asked to approve — and where people stand.",
        "Los informes y resoluciones que se pide a la conferencia aprobar — y dónde se sitúa la gente.",
      ),
    },
    {
      href: `${base}/information`,
      title: pick(lang, "Reports for information", "Informes para conocimiento"),
      blurb: pick(
        lang,
        "Everything conference receives without a vote — explained plainly, in English and Spanish.",
        "Todo lo que la conferencia recibe sin votación — explicado con claridad, en inglés y español.",
      ),
    },
    {
      href: `${base}/agenda`,
      title: pick(lang, "The agenda", "La agenda"),
      blurb: pick(
        lang,
        "What conference will actually decide this year, item by item.",
        "Lo que la conferencia realmente decidirá este año, punto por punto.",
      ),
    },
    {
      href: `${base}/agencies`,
      title: pick(lang, "Agencies & teams", "Agencias y equipos"),
      blurb: pick(
        lang,
        "Who does what — the conference's bodies, boards, and what they answer to.",
        "Quién hace qué — los cuerpos y juntas de la conferencia, y ante quién responden.",
      ),
    },
    {
      href: `${base}/process`,
      title: pick(lang, "How it works", "Cómo funciona"),
      blurb: pick(
        lang,
        "Membership, the consent agenda, resolutions, and motions from the floor.",
        "La membresía, la agenda de consentimiento, las resoluciones y las mociones desde el pleno.",
      ),
    },
    {
      href: `${base}/motions`,
      title: pick(lang, "Making a motion", "Hacer una moción"),
      blurb: pick(
        lang,
        "Say what you want to do; get the words, the vote, and whether it's debatable.",
        "Di lo que quieres hacer; obtén las palabras, la votación y si es debatible.",
      ),
    },
  ];

  return (
    <>
      <p className="eyebrow">
        {pick(
          lang,
          "A community field guide to annual conference",
          "Una guía comunitaria de la conferencia anual",
        )}
      </p>
      <h1>{conf.name}</h1>
      <p className="lede">
        {pick(
          lang,
          "Understand what conference does, ask about anything that’s unclear, and see how the pieces fit together — the official spine, kept current, in plain language.",
          "Entiende lo que hace la conferencia, pregunta cualquier cosa que no esté clara y ve cómo encajan las piezas — la columna oficial, al día, en lenguaje sencillo.",
        )}
      </p>
      <ul className="hub">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href}>
              <h3>{c.title}</h3>
              <p>{c.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PAGE" targetRef="home" />
    </>
  );
}
