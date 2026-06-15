"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { pick, type Lang } from "@/lib/lang";

export default function LoginPage() {
  const lang: Lang =
    typeof document !== "undefined" && document.cookie.includes("fg_lang=es") ? "es" : "en";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

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
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fen-mist">
        Field Guide
      </p>
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
        <form onSubmit={onSubmit} className="mt-6">
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
          {status === "error" && (
            <p className="mt-3 text-sm text-danger">{message}</p>
          )}
        </form>
      )}
    </main>
  );
}
