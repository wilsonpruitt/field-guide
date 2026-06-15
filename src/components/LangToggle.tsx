"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Lang } from "@/lib/lang";

// EN / ES switch. Writes a year-long cookie and refreshes so server components
// re-render in the chosen language. Report content is bilingual; UI chrome
// stays English for now (the content is what matters for Spanish access).
export default function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const set = (l: Lang) => {
    if (l === lang) return;
    document.cookie = `fg_lang=${l}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  };

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button aria-pressed={lang === "en"} disabled={pending} onClick={() => set("en")}>EN</button>
      <span aria-hidden="true">·</span>
      <button aria-pressed={lang === "es"} disabled={pending} onClick={() => set("es")}>ES</button>
    </div>
  );
}
