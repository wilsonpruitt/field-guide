"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { pick, type Lang } from "@/lib/lang";

// Official Google "G" — must not be re-coloured (Google brand guidelines).
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

export default function LoginPage() {
  const lang: Lang =
    typeof document !== "undefined" && document.cookie.includes("fg_lang=es") ? "es" : "en";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [oauthPending, setOauthPending] = useState(false);

  async function signInWithGoogle() {
    setOauthPending(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage(error.message);
      setStatus("error");
      setOauthPending(false);
    }
    // On success the browser redirects to Google; nothing after this runs.
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fen-mist">Field Guide</p>
      <h1 className="mt-1 font-serif text-3xl text-fen">{pick(lang, "Sign in", "Iniciar sesión")}</h1>

      {status === "sent" ? (
        <p className="mt-6 rounded-lg border border-slate-100 bg-ivory p-4 text-[0.95rem]">
          {pick(lang, "Check your email — we sent a sign-in link to ", "Revisa tu correo — enviamos un enlace de acceso a ")}
          <strong>{email}</strong>.{" "}
          {pick(
            lang,
            "Open it on this device and you’ll be signed in. No code to type.",
            "Ábrelo en este dispositivo e iniciarás sesión. No hay código que escribir.",
          )}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={oauthPending}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-md border border-slate-200 bg-ivory px-4 py-2.5 font-medium text-ink hover:border-fen-mist disabled:opacity-60"
          >
            <GoogleG />
            {oauthPending
              ? pick(lang, "Redirecting…", "Redirigiendo…")
              : pick(lang, "Continue with Google", "Continuar con Google")}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-300">
            <span className="h-px flex-1 bg-slate-100" />
            {pick(lang, "or use your email", "o usa tu correo")}
            <span className="h-px flex-1 bg-slate-100" />
          </div>

          <form onSubmit={onSubmit}>
            <label htmlFor="email" className="text-sm text-slate-600">
              {pick(
                lang,
                "We’ll email you a one-tap sign-in link.",
                "Te enviaremos por correo un enlace de acceso de un toque.",
              )}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.org"
              className="mt-2 w-full rounded-md border border-slate-200 bg-ivory px-3 py-2.5 text-base outline-none focus:border-fen-mist"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-3 w-full rounded-md border border-fen bg-fen px-4 py-2.5 font-medium text-ivory hover:bg-fen-mist disabled:opacity-60"
            >
              {status === "sending"
                ? pick(lang, "Sending…", "Enviando…")
                : pick(lang, "Send sign-in link", "Enviar enlace de acceso")}
            </button>
          </form>
        </>
      )}

      {status === "error" && <p className="mt-3 text-sm text-danger">{message}</p>}
    </main>
  );
}
