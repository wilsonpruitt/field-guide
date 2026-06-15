import { getConference } from "@/lib/conference";
import { prisma } from "@/lib/prisma";
import MotionsHelper, { type MotionData } from "@/components/MotionsHelper";

export default async function MotionsPage({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const motions = await prisma.motion.findMany({ where: { conferenceId: conf.id } });

  return (
    <>
      <p className="eyebrow">Parliamentary helper</p>
      <h1>What do you want to do?</h1>
      <p>
        Describe it, or pick a kind of motion. Each card tells you what to say, whether it needs a
        second, whether it can be debated or amended, and the vote required.
      </p>
      <MotionsHelper motions={motions as MotionData[]} />
    </>
  );
}
