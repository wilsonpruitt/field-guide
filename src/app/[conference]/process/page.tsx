import Link from "next/link";
import { getConference } from "@/lib/conference";
import { prisma } from "@/lib/prisma";

export default async function ProcessIndex({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const pages = await prisma.processPage.findMany({
    where: { conferenceId: conf.id },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });

  return (
    <>
      <p className="eyebrow">How conference works</p>
      <h1>The mechanics</h1>
      <p className="lede">
        Not a specific item of business — the standing machinery: who&rsquo;s a member and who
        votes, the consent agenda, resolutions, and motions from the floor.
      </p>
      <ul className="bare">
        {pages.map((p) => (
          <li key={p.id}>
            <Link href={`/${conf.slug}/process/${p.slug}`}>{p.title}</Link>
            <p className="muted" style={{ margin: ".25rem 0 0", fontSize: ".9rem" }}>{p.summary}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
