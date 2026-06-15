import { PrismaClient } from "@prisma/client";

// Bootstrap / adjust a member's trust level in a conference.
// Everyone starts at Member (TL1), so the FIRST steward must be granted here
// (then stewards can appoint others in-app at /[conference]/moderate).
//
//   pnpm grant-trust <email> <conferenceSlug> <level 0-4>
//   pnpm grant-trust wilson@example.com riotexas 4
//
// The person must have signed in at least once (so a Profile exists).

const prisma = new PrismaClient();

async function main() {
  const [email, slug, levelRaw] = process.argv.slice(2);
  const level = Number(levelRaw);
  if (!email || !slug || Number.isNaN(level) || level < 0 || level > 4) {
    console.error("Usage: pnpm grant-trust <email> <conferenceSlug> <level 0-4>");
    process.exit(1);
  }

  const conference = await prisma.conference.findUnique({ where: { slug } });
  if (!conference) throw new Error(`No conference with slug "${slug}".`);

  const profile = await prisma.profile.findFirst({ where: { email } });
  if (!profile) throw new Error(`No profile for "${email}". They must sign in once first.`);

  const membership = await prisma.conferenceMembership.upsert({
    where: { conferenceId_profileId: { conferenceId: conference.id, profileId: profile.id } },
    update: { trustLevel: level },
    create: { conferenceId: conference.id, profileId: profile.id, role: profile.defaultRole, trustLevel: level },
  });

  const labels = ["Visitor", "Member", "Regular", "Editor", "Steward"];
  console.log(`✓ ${email} is now ${labels[level]} (TL${level}) in ${conference.name}.`);
  return membership;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
