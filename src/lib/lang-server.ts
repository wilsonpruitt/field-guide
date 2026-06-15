import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "@/lib/lang";

/** The reader's language preference (cookie-backed; defaults to English). Server-only. */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === "es" ? "es" : "en";
}
