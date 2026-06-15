import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Tenant #1 — the Río Texas Annual Conference.
  const riotexas = await prisma.conference.upsert({
    where: { slug: 'riotexas' },
    update: { name: 'Río Texas Annual Conference' },
    create: {
      slug: 'riotexas',
      name: 'Río Texas Annual Conference',
      disciplineEdition: '2020/2024',
    },
  });
  console.log(`✓ Conference seeded: ${riotexas.name} (/${riotexas.slug})`);

  // Full Río Texas spine + BoD glossary are ported in the next pass.
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
