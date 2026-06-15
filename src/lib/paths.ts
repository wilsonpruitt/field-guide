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

export function pathFor(conferenceSlug: string, targetType: string, targetRef: string): string {
  const base = targetRef.split("#")[0];
  if (targetType === "PAGE") return base === "home" ? `/${conferenceSlug}` : `/${conferenceSlug}/${base}`;
  return `/${conferenceSlug}/${SECTION[targetType] ?? ""}/${base}`;
}
