import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/update-session";
import { APEX, isConferenceSubdomain } from "@/lib/host";

// Next 16: the `middleware` convention was renamed to `proxy`.
//
// Routing model:
//   <slug>.conferencefieldguide.org/PATH  → internally serves /<slug>/PATH
//                                           (clean URL stays in the browser)
//   conferencefieldguide.org              → landing / picker (path-mode still
//                                           works for previews & localhost)
//   guide.wrootlabs.com/<slug>/PATH       → 301 → <slug>.conferencefieldguide.org/PATH
//
// Routes that are not conference-scoped and must never be slug-prefixed:
const SHARED = ["/login", "/auth", "/walkthrough", "/api", "/flyers"];
const LEGACY = "guide.wrootlabs.com";

const isShared = (path: string) => SHARED.some((p) => path === p || path.startsWith(p + "/"));

export async function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const path = request.nextUrl.pathname;

  // 1) Legacy domain → permanent redirect to the new home, mapping the old
  //    path-based URL onto the matching subdomain.
  if (host === LEGACY) {
    const dest = new URL(request.url);
    dest.protocol = "https:";
    const seg = path.split("/").filter(Boolean);
    if (seg.length > 0 && !isShared(path)) {
      const [slug, ...rest] = seg;
      dest.host = `${slug}.${APEX}`;
      dest.pathname = "/" + rest.join("/");
    } else {
      dest.host = APEX; // home + shared routes land on the apex
    }
    return NextResponse.redirect(dest, 301);
  }

  // 2) Conference subdomain → rewrite to the path-based [conference] route,
  //    while refreshing the Supabase session on the same response.
  if (isConferenceSubdomain(host) && !isShared(path)) {
    const slug = host.slice(0, -`.${APEX}`.length);
    const dest = request.nextUrl.clone();
    dest.pathname = `/${slug}${path === "/" ? "" : path}`;
    return updateSession(request, () => NextResponse.rewrite(dest, { request }));
  }

  // 3) Apex, www, previews, localhost → normal path-based serving + session.
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets, image optimization, and files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
