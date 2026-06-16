import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { cookieDomainFor } from '@/lib/cookie-domain';

// Server-side Supabase client (App Router). Reads/writes the auth cookies so
// sessions persist across requests. Use in Server Components, Route Handlers,
// and Server Actions. Cookies are scoped to `.conferencefieldguide.org` so a
// session is shared across the apex and all conference subdomains.
export async function createClient() {
  const cookieStore = await cookies();
  const domain = cookieDomainFor((await headers()).get('host'));

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { domain },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — middleware refreshes the session instead.
          }
        },
      },
    },
  );
}
