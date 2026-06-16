import { headers } from "next/headers";
import { APEX } from "@/lib/cookie-domain";

// Production apex (re-exported from the client-safe module). Each conference
// lives at <slug>.conferencefieldguide.org; the apex serves the landing page.
export { APEX };

function hostOf(h: string | null): string {
  return (h ?? "").split(":")[0].toLowerCase();
}

/** True when the current request is served on a conference subdomain. */
export function isConferenceSubdomain(host: string): boolean {
  return host.endsWith(`.${APEX}`) && host !== `www.${APEX}`;
}

/**
 * Link prefix for in-conference links. On a conference subdomain this is "" so
 * links are clean and slug-relative (/agencies/…). Everywhere else — apex
 * path-mode, localhost, preview deploys, the legacy wrootlabs domain — it is
 * "/<slug>" so the path-based [conference] routes keep working.
 */
export async function linkBase(slug: string): Promise<string> {
  const host = hostOf((await headers()).get("host"));
  return isConferenceSubdomain(host) ? "" : `/${slug}`;
}

/** Href back to the Field Guide landing — the apex from a subdomain, "/" in dev/path-mode. */
export async function fieldGuideHomeHref(): Promise<string> {
  const host = hostOf((await headers()).get("host"));
  return isConferenceSubdomain(host) ? `https://${APEX}` : "/";
}

/** Absolute (or path) href to a conference home, used by the apex landing. */
export async function conferenceHref(slug: string): Promise<string> {
  const host = hostOf((await headers()).get("host"));
  // On the real apex/www, send people to the conference's subdomain.
  if (host === APEX || host === `www.${APEX}` || host.endsWith(`.${APEX}`)) {
    return `https://${slug}.${APEX}`;
  }
  // localhost / preview / legacy domain → path-based so dev & previews work.
  return `/${slug}`;
}
