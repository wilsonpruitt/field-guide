// Client-safe language helpers (no server-only imports — safe in client components).
export type Lang = "en" | "es";
export const LANG_COOKIE = "fg_lang";

/** Pick the Spanish value when reading in Spanish and it exists; else English. */
export function pick<T>(lang: Lang, en: T, es: T | null | undefined): T {
  return lang === "es" && es ? (es as T) : en;
}
