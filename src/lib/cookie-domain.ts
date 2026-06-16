// Client-safe (no next/headers): the production apex + the auth cookie domain.
// Auth cookies are scoped to `.conferencefieldguide.org` so one sign-in covers
// the apex and every conference subdomain. On localhost / preview / the legacy
// domain we return undefined (host-only) so those keep working.
export const APEX = "conferencefieldguide.org";

export function cookieDomainFor(host: string | null | undefined): string | undefined {
  const h = (host ?? "").split(":")[0].toLowerCase();
  return h === APEX || h.endsWith(`.${APEX}`) ? `.${APEX}` : undefined;
}
