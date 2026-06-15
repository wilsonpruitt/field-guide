import Link from "next/link";
import { getConference } from "@/lib/conference";

export default async function ConferenceHome({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const base = `/${conf.slug}`;

  const cards = [
    { href: `${base}/schedule`, title: "This year's schedule", blurb: "The full timeline, hour by hour — with the business and votes highlighted." },
    { href: `${base}/agenda`, title: "The agenda", blurb: "What conference will actually decide this year, item by item." },
    { href: `${base}/agencies`, title: "Agencies & teams", blurb: "Who does what — the conference's bodies, boards, and what they answer to." },
    { href: `${base}/process`, title: "How it works", blurb: "Membership, the consent agenda, resolutions, and motions from the floor." },
    { href: `${base}/motions`, title: "Making a motion", blurb: "Say what you want to do; get the words, the vote, and whether it's debatable." },
  ];

  return (
    <>
      <p className="eyebrow">A community field guide to annual conference</p>
      <h1>{conf.name}</h1>
      <p className="lede">
        Understand what conference does, ask about anything that&rsquo;s unclear, and see how the
        pieces fit together — the official spine, kept current, in plain language.
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
    </>
  );
}
