import Link from "next/link";
import { getConference } from "@/lib/conference";
import { getViewer } from "@/lib/community";
import { TL } from "@/lib/moderation";
import { pick } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import LangToggle from "@/components/LangToggle";

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
  const [viewer, lang] = await Promise.all([getViewer(conf.id), getLang()]);
  const isModerator = (viewer?.trustLevel ?? 0) >= TL.EDITOR;

  return (
    <div className="fg-shell">
      <header className="fg-site">
        <Link className="fg-brand" href={base}>
          {conf.name}
        </Link>
        <nav>
          <Link href={`${base}/schedule`}>{pick(lang, "Schedule", "Programa")}</Link>
          <Link href={`${base}/actions`}>{pick(lang, "Up for a vote", "Para votación")}</Link>
          <Link href={`${base}/information`}>{pick(lang, "Information", "Información")}</Link>
          <Link href={`${base}/agenda`}>{pick(lang, "Agenda", "Agenda")}</Link>
          <Link href={`${base}/agencies`}>{pick(lang, "Agencies", "Agencias")}</Link>
          <Link href={`${base}/process`}>{pick(lang, "How it works", "Cómo funciona")}</Link>
          <Link href={`${base}/motions`}>{pick(lang, "Motions", "Mociones")}</Link>
          <Link href={`${base}/discipline`}>{pick(lang, "Discipline", "Disciplina")}</Link>
          {isModerator && (
            <Link href={`${base}/moderate`}>
              {pick(lang, "Steward’s desk", "Mesa de custodios")}
            </Link>
          )}
        </nav>
        <LangToggle lang={lang} />
      </header>
      <main className="fg-main">{children}</main>
      <footer className="fg-site">
        <p>
          {conf.name} · {pick(lang, "community field guide", "guía comunitaria")} ·{" "}
          {pick(lang, "the numbers via", "los números vía")}{" "}
          <a href="https://riotexas.wrootlabs.com">{pick(lang, "the Atlas", "el Atlas")}</a> ·{" "}
          {pick(lang, "a", "una guía de")}{" "}
          <a href="https://wrootlabs.com">Wroot Labs</a>
          {pick(lang, " guide.", ".")}
        </p>
      </footer>
    </div>
  );
}
