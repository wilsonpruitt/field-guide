import { getConference } from "@/lib/conference";
import { pick } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { prisma } from "@/lib/prisma";
import MotionsHelper, { type MotionData } from "@/components/MotionsHelper";

import Community from "@/components/Community";

export default async function MotionsPage({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const [conf, lang] = await Promise.all([getConference(conference), getLang()]);
  const motions = await prisma.motion.findMany({ where: { conferenceId: conf.id } });

  return (
    <>
      <p className="eyebrow">{pick(lang, "Parliamentary helper", "Asistente parlamentario")}</p>
      <h1>{pick(lang, "What do you want to do?", "¿Qué quieres hacer?")}</h1>
      <p>
        {pick(
          lang,
          "Describe it, or pick a kind of motion. Each card tells you what to say, whether it needs a second, whether it can be debated or amended, and the vote required.",
          "Descríbelo, o elige un tipo de moción. Cada tarjeta te dice qué decir, si requiere apoyo, si puede debatirse o enmendarse, y la votación requerida.",
        )}
      </p>
      <MotionsHelper motions={motions as MotionData[]} lang={lang} />
      <Community conferenceId={conf.id} conferenceSlug={conf.slug} targetType="PAGE" targetRef="motions" />
    </>
  );
}
