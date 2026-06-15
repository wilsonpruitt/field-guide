import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Magic-link landing: Supabase redirects here with a `code`; we exchange it for
// a session and ensure the person has a Profile row. No OTP code entry.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Only allow same-site relative paths — reject //evil.com, /\evil.com, absolute URLs.
  const rawNext = searchParams.get("next") ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await prisma.profile.upsert({
          where: { id: user.id },
          update: { email: user.email ?? null },
          create: {
            id: user.id,
            email: user.email ?? null,
            displayName: user.email?.split("@")[0] ?? "Member",
          },
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
