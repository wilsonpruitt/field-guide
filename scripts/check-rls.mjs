// Guard: every Prisma model must have a matching RLS line in supabase/rls.sql.
//
// RLS is our only lock on Supabase's public PostgREST API (see supabase/rls.sql).
// A model added to the schema but not to rls.sql ships a table that anyone with
// the project URL + anon key can read/write. This fails the build loudly so that
// can't happen silently.
//
// No @@map in the schema today, so model name == table name. If that changes,
// teach this script to resolve @@map("…").

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const rls = readFileSync(join(root, "supabase/rls.sql"), "utf8");

const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]);
const guarded = new Set(
  [...rls.matchAll(/alter table\s+"public"\."(\w+)"/gi)].map((m) => m[1]),
);

const missing = models.filter((m) => !guarded.has(m));

if (missing.length) {
  console.error(
    `\n✗ RLS guard: ${missing.length} table(s) in schema.prisma have no RLS line in supabase/rls.sql:\n` +
      missing.map((m) => `    - ${m}`).join("\n") +
      `\n\n  Add them to supabase/rls.sql, then run: pnpm run db:rls\n`,
  );
  process.exit(1);
}

console.log(`✓ RLS guard: all ${models.length} tables covered by supabase/rls.sql`);
