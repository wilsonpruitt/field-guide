import { createBrowserClient } from '@supabase/ssr';
import { cookieDomainFor } from '@/lib/cookie-domain';

// Browser-side Supabase client for Client Components. Auth cookies are scoped
// to `.conferencefieldguide.org` (when on that domain) so a sign-in is shared
// across the apex and all conference subdomains.
export function createClient() {
  const domain =
    typeof window !== 'undefined' ? cookieDomainFor(window.location.hostname) : undefined;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { domain } },
  );
}
