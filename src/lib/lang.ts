import { cookies } from "next/headers";

export type Lang = "en" | "es";
export const LANG_COOKIE = "fg_lang";

/** The reader's language preference (cookie-backed; defaults to English). */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "es" ? "es" : "en";
}

/** Pick the Spanish value when reading in Spanish and it exists; else English. */
export function pick<T>(lang: Lang, en: T, es: T | null | undefined): T {
  return lang === "es" && es ? (es as T) : en;
}
