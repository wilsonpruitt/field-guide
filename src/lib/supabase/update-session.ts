import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session on every request and keeps the auth
// cookies in sync. Called from proxy.ts (Next 16's renamed middleware).
//
// `makeResponse` lets the caller choose what response carries the refreshed
// cookies — a plain pass-through (default) or a rewrite (used for conference
// subdomains, so the session refresh and the rewrite happen together).
export async function updateSession(
  request: NextRequest,
  makeResponse: () => NextResponse = () => NextResponse.next({ request }),
) {
  let response = makeResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = makeResponse();
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touch the user to refresh the session cookie. Do not run logic between
  // creating the client and this call (per Supabase SSR guidance).
  await supabase.auth.getUser();

  return response;
}
