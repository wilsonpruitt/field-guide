import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/update-session";

// Next 16: the `middleware` convention was renamed to `proxy`.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets, image optimization, and files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
