// Map a contribution target to its page path (for links + cache revalidation).
// PAGE targets aren't a spine element — their ref is the route segment, with
// "home" meaning the conference hub.
const SECTION: Record<string, string> = {
  BODY: "agencies",
  AGENDA: "agenda",
  PROCESS: "process",
  ACTION: "actions",
  INFO: "information",
};

// Internal route path — always slug-prefixed. Use for revalidatePath(), since
// the cached route is /[conference]/… regardless of the public URL shape.
export function pathFor(conferenceSlug: string, targetType: string, targetRef: string): string {
  const base = targetRef.split("#")[0];
  if (targetType === "PAGE") return base === "home" ? `/${conferenceSlug}` : `/${conferenceSlug}/${base}`;
  return `/${conferenceSlug}/${SECTION[targetType] ?? ""}/${base}`;
}

// Browser href — `basePrefix` is "" on a conference subdomain (clean URLs) or
// "/<slug>" in path mode (apex/preview/localhost). See lib/host.ts → linkBase().
export function hrefFor(basePrefix: string, targetType: string, targetRef: string): string {
  const ref = targetRef.split("#")[0];
  if (targetType === "PAGE") return ref === "home" ? basePrefix || "/" : `${basePrefix}/${ref}`;
  return `${basePrefix}/${SECTION[targetType] ?? ""}/${ref}`;
}
