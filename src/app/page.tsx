import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";
import { conferenceHref } from "@/lib/host";

export default async function Home() {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    conferences,
    lang,
  ] = await Promise.all([
    supabase.auth.getUser(),
    prisma.conference.findMany({ orderBy: { name: "asc" } }),
    getLang(),
  ]);
  // On the apex these point at each conference's subdomain; in dev/preview they
  // stay path-based so the picker keeps working.
  const confLinks = await Promise.all(
    conferences.map(async (c) => ({ id: c.id, name: c.name, href: await conferenceHref(c.slug) })),
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16">
      <header className="flex items-baseline justify-between gap-4 border-b border-slate-100 pb-4">
        <span className="font-serif text-xl text-fen">Field Guide</span>
        {user ? (
          <form action="/auth/signout" method="post" className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user.email}</span>
            <button className="text-sm text-fen underline decoration-reed underline-offset-4 hover:text-ink">
              {pick(lang, "Sign out", "Cerrar sesión")}
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="text-sm text-fen underline decoration-reed underline-offset-4 hover:text-ink"
          >
            {pick(lang, "Sign in", "Iniciar sesión")}
          </Link>
        )}
      </header>

      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.12em] text-fen-mist">
        {pick(
          lang,
          "A community field guide to annual conference",
          "Una guía comunitaria de la conferencia anual",
        )}
      </p>
      <h1 className="mt-1 font-serif text-4xl leading-tight text-fen">
        {pick(lang, "Understand it. Ask about it. Talk it through.", "Entiéndela. Pregúntala. Conversa.")}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink">
        {pick(
          lang,
          "Annual Conference moves fast — hundreds of pages of reports, a dense agenda, and votes that shape a whole region's ministry. Field Guide turns that into something you can actually read, question, and talk through before you walk onto the floor.",
          "La conferencia anual avanza rápido: cientos de páginas de informes, una agenda densa y votos que dan forma al ministerio de toda una región. Field Guide convierte todo eso en algo que de verdad puedes leer, cuestionar y conversar antes de entrar al pleno.",
        )}
      </p>
      <p className="mt-3 text-sm">
        <Link
          href="/walkthrough"
          className="text-fen underline decoration-reed underline-offset-4 hover:text-ink"
        >
          {pick(lang, "How Field Guide works →", "Cómo funciona Field Guide →")}
        </Link>
      </p>

      <h2 className="mt-10 font-serif text-2xl text-fen">{pick(lang, "Conferences", "Conferencias")}</h2>
      <ul className="mt-3">
        {confLinks.map((c) => (
          <li key={c.id} className="border-b border-slate-100 py-3">
            <Link
              href={c.href}
              className="text-fen underline decoration-reed underline-offset-4 hover:text-ink"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-14 border-t border-slate-100 pt-8">
        <h2 className="font-serif text-2xl text-fen">
          {pick(lang, "Built from the public record", "Construido a partir del registro público")}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-ink">
          {pick(
            lang,
            "Field Guide is built entirely from the materials each conference already publishes for its members — pre-conference reports, session handbooks, the Conference Journal, and the Book of Discipline. Nothing here isn't already public. What we add is shape: plain-language summaries, a structure you can navigate, and a citation on every report that links back to the exact page of the official document, so you can always check the source yourself.",
            "Field Guide se construye por completo a partir de los materiales que cada conferencia ya publica para sus miembros: informes preconferencia, manuales de la sesión, el Diario de la Conferencia y el Libro de Disciplina. Nada de lo que aparece aquí deja de ser público. Lo que añadimos es forma: resúmenes en lenguaje sencillo, una estructura navegable y una cita en cada informe que enlaza a la página exacta del documento oficial, para que siempre puedas comprobar la fuente.",
          )}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink">
          {pick(
            lang,
            "It is a community resource, not an official one. Field Guide isn't published by any annual conference or by The United Methodist Church. It's a tool for delegates, clergy, and lay members to understand the business before them and talk it through in good faith. Questions, perspectives, and notes come from the community and are reviewed by volunteer stewards — never presented as the conference's own voice.",
            "Es un recurso comunitario, no oficial. Field Guide no es publicado por ninguna conferencia anual ni por la Iglesia Metodista Unida. Es una herramienta para que delegados, clero y miembros laicos comprendan los asuntos ante ellos y los conversen de buena fe. Las preguntas, perspectivas y notas provienen de la comunidad y son revisadas por custodios voluntarios; nunca se presentan como la voz de la conferencia.",
          )}
        </p>
      </section>
    </main>
  );
}
