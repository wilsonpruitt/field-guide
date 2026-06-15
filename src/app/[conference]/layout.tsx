import Link from "next/link";
import { getConference } from "@/lib/conference";

export default async function ConferenceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const base = `/${conf.slug}`;

  return (
    <div className="fg-shell">
      <header className="fg-site">
        <Link className="fg-brand" href={base}>
          {conf.name}
        </Link>
        <nav>
          <Link href={`${base}/agenda`}>Agenda</Link>
          <Link href={`${base}/agencies`}>Agencies</Link>
          <Link href={`${base}/process`}>How it works</Link>
          <Link href={`${base}/motions`}>Motions</Link>
        </nav>
      </header>
      <main className="fg-main">{children}</main>
      <footer className="fg-site">
        <p>
          {conf.name} · community field guide · the numbers via{" "}
          <a href="https://riotexas.wrootlabs.com">the Atlas</a> · a{" "}
          <a href="https://wrootlabs.com">Wroot Labs</a> guide.
        </p>
      </footer>
    </div>
  );
}
