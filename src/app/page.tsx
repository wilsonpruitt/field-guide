import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/lang";
import { getLang } from "@/lib/lang-server";

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
        {conferences.map((c) => (
          <li key={c.id} className="border-b border-slate-100 py-3">
            <Link
              href={`/${c.slug}`}
              className="text-fen underline decoration-reed underline-offset-4 hover:text-ink"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
