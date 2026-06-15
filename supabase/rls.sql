-- Field Guide — Row-Level Security.
--
-- The app accesses Postgres through Prisma as the table-owner `postgres` role,
-- which BYPASSES RLS — so the application keeps full access. RLS exists to lock
-- down Supabase's auto-generated PostgREST API, which exposes every public table
-- to the *public anon key*. We enable RLS with NO anon/authenticated policies
-- (default-deny): the REST API returns nothing, while Prisma is unaffected.
--
-- Re-runnable. Apply with:  pnpm run db:rls
-- Add narrow SELECT policies later if/when we do client-side reads of published
-- community content (e.g. realtime comment streams).

alter table "public"."Conference"            enable row level security;
alter table "public"."Body"                  enable row level security;
alter table "public"."AgendaItem"            enable row level security;
alter table "public"."ProcessPage"           enable row level security;
alter table "public"."Motion"                enable row level security;
alter table "public"."Roster"                enable row level security;
alter table "public"."RosterMember"          enable row level security;
alter table "public"."PerYearInstance"       enable row level security;
alter table "public"."BodParagraph"          enable row level security;
alter table "public"."Profile"               enable row level security;
alter table "public"."ConferenceMembership"  enable row level security;
alter table "public"."Contribution"          enable row level security;
alter table "public"."Endorsement"           enable row level security;
alter table "public"."Flag"                  enable row level security;
alter table "public"."ReputationEvent"       enable row level security;
