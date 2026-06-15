import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "@/lib/lang";
import { isBilingual } from "@/lib/conference";

/** The reader's language preference (cookie-backed; defaults to English). Server-only. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "es" ? "es" : "en";
}

/** The reading language for a specific conference: the reader's preference for
 *  bilingual conferences, always English for English-only ones. */
export async function langFor(slug: string): Promise<Lang> {
  return isBilingual(slug) ? getLang() : "en";
}
