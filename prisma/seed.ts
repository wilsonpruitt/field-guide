import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const ROOT = join(__dirname, 'seed-data');
/** Load a required snapshot file from `dir`. */
const load = <T>(dir: string, name: string): T =>
  JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as T;
/** Load an optional snapshot file; return `fallback` if the file is absent. */
const loadOpt = <T>(dir: string, name: string, fallback: T): T => {
  try {
    return JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as T;
  } catch {
    return fallback;
  }
};

// ── snapshot shapes (ported from the Río Texas ac-guide; see prisma/seed-data/) ──
type BodyRow = {
  slug: string; name: string; alsoKnownAs?: string | null;
  type: 'UNITING_TABLE' | 'VISION_TEAM' | 'ADMINISTRATIVE_AGENCY' | 'REVIEW_COMMITTEE' | 'BOARD';
  parentSlug?: string | null; bodRefs?: string[]; membershipSize?: number | null;
  relatesTo?: string[]; alsoFulfills?: unknown; subBodies?: unknown;
  votesOn?: 'ACTION' | 'INFORMATION' | 'BOTH' | null; agendaOrder?: number | null;
  accountableTo?: string; summary?: string | null; sourcePage?: number | null;
};
type AgendaRow = {
  slug: string; title: string; order: number; summary: string; contentMd?: string;
  votesOn?: 'ACTION' | 'INFORMATION' | 'BOTH' | null; bodySlug?: string | null;
  bodRefs?: string[]; rulesRefs?: string[]; perYear?: 'FINANCE' | 'NOMINATIONS' | null;
  sourcePage?: number | null;
};
type ProcessRow = {
  slug: string; title: string; order?: number; summary: string; contentMd?: string;
  bodRefs?: string[]; rulesRefs?: string[]; sourcePage?: number | null;
};
type MotionRow = {
  key: string; intent: string; say: string;
  category: 'PRIVILEGED' | 'SUBSIDIARY' | 'INCIDENTAL' | 'MAIN' | 'BRING_BACK';
  rank?: number | null; second: boolean; debatable: boolean; amendable: boolean;
  vote: 'MAJORITY' | 'TWO_THIRDS' | 'NONE'; note?: string | null;
};
type RosterRow = {
  bodySlug: string; year: number; source: string; toElect?: number; byOffice?: boolean; note?: string | null;
  members: Array<{
    orderIndex: number; name: string; position?: string | null; klass?: string | null;
    district?: string | null; status?: string | null; gender?: string | null; race?: string | null;
    office?: string | null; holder?: string | null; nominee?: boolean; vacant?: boolean; note?: string | null;
  }>;
};
type PerYearRow = { kind: 'FINANCE' | 'NOMINATIONS' | 'SCHEDULE'; year: number; source?: string | null; data: unknown };
type ActionRow = {
  year: number; slug: string; order?: number; number?: string | null; title: string; titleEs?: string | null;
  agencySlug?: string | null; category?: string | null; summary: string; summaryEs?: string | null;
  contentMd?: string; contentMdEs?: string | null; bodRefs?: string[]; source?: string | null; sourcePage?: number | null;
};
type InfoRow = {
  year: number; slug: string; order?: number; number?: string | null; title: string; titleEs?: string | null;
  agencySlug?: string | null; category?: string | null; summary: string; summaryEs?: string | null;
  contentMd?: string; contentMdEs?: string | null; bodRefs?: string[]; source?: string | null; sourcePage?: number | null;
};
type ContributionRow = {
  id: string; type: 'QUESTION' | 'ANSWER' | 'COMMENT' | 'PERSPECTIVE' | 'EDIT_PROPOSAL';
  targetType: 'BODY' | 'AGENDA' | 'PROCESS'; targetRef: string; authorName?: string | null;
  body: string; stance?: 'IN_FAVOR' | 'CONCERN' | 'CLARIFICATION' | 'ALTERNATIVE' | null;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'SUPERSEDED'; publishedAt?: string | null; createdAt?: string | null;
};
type BodRow = { number: number; title?: string | null; excerpt: string; source: 'PLENARY' | 'BOD_PDF'; edition?: string };

type ConferenceSeed = { slug: string; name: string; disciplineEdition: string; dir: string; handbookUrl?: string | null; handbookLabel?: string | null };

/** Seed (or update) one conference tenant from its snapshot directory. Every
 *  per-conference file is optional, so a conference can be onboarded with only
 *  the materials available today (e.g. a session before its journal lands). */
async function seedConference({ slug, name, disciplineEdition, dir, handbookUrl, handbookLabel }: ConferenceSeed) {
  const conf = await prisma.conference.upsert({
    where: { slug },
    update: { name, handbookUrl: handbookUrl ?? null, handbookLabel: handbookLabel ?? null },
    create: { slug, name, disciplineEdition, handbookUrl: handbookUrl ?? null, handbookLabel: handbookLabel ?? null },
  });
  const conferenceId = conf.id;
  console.log(`\n▶ Conference: ${conf.name} (/${conf.slug})`);

  // ── Bodies (two passes: create, then wire parents by slug) ──
  const agencies = loadOpt<BodyRow[]>(dir, 'agencies', []);
  const bodyIdBySlug = new Map<string, string>();
  for (const a of agencies) {
    const data = {
      name: a.name, alsoKnownAs: a.alsoKnownAs ?? null, type: a.type,
      bodRefs: a.bodRefs ?? [], membershipSize: a.membershipSize ?? null,
      relatesTo: a.relatesTo ?? [],
      alsoFulfills: (a.alsoFulfills ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      subBodies: (a.subBodies ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      votesOn: a.votesOn ?? null, agendaOrder: a.agendaOrder ?? null,
      accountableTo: a.accountableTo ?? 'Annual Conference', summary: a.summary ?? null,
      sourcePage: a.sourcePage ?? null,
    };
    const body = await prisma.body.upsert({
      where: { conferenceId_slug: { conferenceId, slug: a.slug } },
      update: data,
      create: { conferenceId, slug: a.slug, ...data },
    });
    bodyIdBySlug.set(a.slug, body.id);
  }
  for (const a of agencies) {
    if (!a.parentSlug) continue;
    const parentId = bodyIdBySlug.get(a.parentSlug);
    if (parentId) await prisma.body.update({ where: { id: bodyIdBySlug.get(a.slug)! }, data: { parentId } });
  }
  console.log(`  ✓ Bodies: ${agencies.length}`);

  // ── Agenda items ──
  const agenda = loadOpt<AgendaRow[]>(dir, 'agenda', []);
  for (const it of agenda) {
    const data = {
      title: it.title, order: it.order, summary: it.summary, contentMd: it.contentMd ?? '',
      votesOn: it.votesOn ?? null, bodySlug: it.bodySlug ?? null,
      bodRefs: it.bodRefs ?? [], rulesRefs: it.rulesRefs ?? [], perYear: it.perYear ?? null,
      sourcePage: it.sourcePage ?? null,
    };
    await prisma.agendaItem.upsert({
      where: { conferenceId_slug: { conferenceId, slug: it.slug } },
      update: data, create: { conferenceId, slug: it.slug, ...data },
    });
  }
  console.log(`  ✓ Agenda items: ${agenda.length}`);

  // ── Process pages ──
  const process = loadOpt<ProcessRow[]>(dir, 'process', []);
  for (const p of process) {
    const data = {
      title: p.title, order: p.order ?? 0, summary: p.summary, contentMd: p.contentMd ?? '',
      bodRefs: p.bodRefs ?? [], rulesRefs: p.rulesRefs ?? [], sourcePage: p.sourcePage ?? null,
    };
    await prisma.processPage.upsert({
      where: { conferenceId_slug: { conferenceId, slug: p.slug } },
      update: data, create: { conferenceId, slug: p.slug, ...data },
    });
  }
  console.log(`  ✓ Process pages: ${process.length}`);

  // ── Motions ──
  const motions = loadOpt<MotionRow[]>(dir, 'motions', []);
  for (const m of motions) {
    const data = {
      intent: m.intent, say: m.say, category: m.category, rank: m.rank ?? null,
      second: m.second, debatable: m.debatable, amendable: m.amendable, vote: m.vote, note: m.note ?? null,
    };
    await prisma.motion.upsert({
      where: { conferenceId_key: { conferenceId, key: m.key } },
      update: data, create: { conferenceId, key: m.key, ...data },
    });
  }
  console.log(`  ✓ Motions: ${motions.length}`);

  // ── Rosters (+ members; replace members on each run) ──
  const rosters = loadOpt<RosterRow[]>(dir, 'rosters', []);
  for (const r of rosters) {
    const roster = await prisma.roster.upsert({
      where: { conferenceId_bodySlug_year: { conferenceId, bodySlug: r.bodySlug, year: r.year } },
      update: { source: r.source, toElect: r.toElect ?? 0, byOffice: r.byOffice ?? false, note: r.note ?? null },
      create: { conferenceId, bodySlug: r.bodySlug, year: r.year, source: r.source, toElect: r.toElect ?? 0, byOffice: r.byOffice ?? false, note: r.note ?? null },
    });
    await prisma.rosterMember.deleteMany({ where: { rosterId: roster.id } });
    await prisma.rosterMember.createMany({
      data: r.members.map((m) => ({
        rosterId: roster.id, orderIndex: m.orderIndex,
        name: m.name ?? m.holder ?? m.office ?? '—', position: m.position ?? null,
        klass: m.klass ?? null, district: m.district ?? null, status: m.status ?? null,
        gender: m.gender ?? null, race: m.race ?? null, office: m.office ?? null, holder: m.holder ?? null,
        nominee: m.nominee ?? false, vacant: m.vacant ?? false, note: m.note ?? null,
      })),
    });
  }
  console.log(`  ✓ Rosters: ${rosters.length} (${rosters.reduce((n, r) => n + r.members.length, 0)} members)`);

  // ── Per-year instances (finance series + nominations slate + schedule) ──
  const perYear = [
    ...loadOpt<PerYearRow[]>(dir, 'finance', []),
    ...loadOpt<PerYearRow[]>(dir, 'nominations', []),
    ...loadOpt<PerYearRow[]>(dir, 'schedule', []),
  ];
  for (const py of perYear) {
    await prisma.perYearInstance.upsert({
      where: { conferenceId_kind_year: { conferenceId, kind: py.kind, year: py.year } },
      update: { source: py.source ?? null, data: py.data as Prisma.InputJsonValue },
      create: { conferenceId, kind: py.kind, year: py.year, source: py.source ?? null, data: py.data as Prisma.InputJsonValue },
    });
  }
  console.log(`  ✓ Per-year instances: ${perYear.length}`);

  // ── Action items (this year's "For Conference Action" reports) ──
  const actions = loadOpt<ActionRow[]>(dir, 'actions', []);
  for (const a of actions) {
    const data = {
      order: a.order ?? 0, number: a.number ?? null, title: a.title, titleEs: a.titleEs ?? null,
      agencySlug: a.agencySlug ?? null, category: a.category ?? null,
      summary: a.summary, summaryEs: a.summaryEs ?? null,
      contentMd: a.contentMd ?? '', contentMdEs: a.contentMdEs ?? null,
      bodRefs: a.bodRefs ?? [], source: a.source ?? null, sourcePage: a.sourcePage ?? null,
    };
    await prisma.actionItem.upsert({
      where: { conferenceId_year_slug: { conferenceId, year: a.year, slug: a.slug } },
      update: data, create: { conferenceId, year: a.year, slug: a.slug, ...data },
    });
  }
  console.log(`  ✓ Action items: ${actions.length}`);

  // ── Information reports (this year's "For Information Only" reports, bilingual) ──
  const infos = loadOpt<InfoRow[]>(dir, 'info-reports', []);
  for (const r of infos) {
    const data = {
      order: r.order ?? 0, number: r.number ?? null, title: r.title, titleEs: r.titleEs ?? null,
      agencySlug: r.agencySlug ?? null, category: r.category ?? null,
      summary: r.summary, summaryEs: r.summaryEs ?? null,
      contentMd: r.contentMd ?? '', contentMdEs: r.contentMdEs ?? null,
      bodRefs: r.bodRefs ?? [], source: r.source ?? null, sourcePage: r.sourcePage ?? null,
    };
    await prisma.infoReport.upsert({
      where: { conferenceId_year_slug: { conferenceId, year: r.year, slug: r.slug } },
      update: data, create: { conferenceId, year: r.year, slug: r.slug, ...data },
    });
  }
  console.log(`  ✓ Info reports: ${infos.length}`);

  // ── Seed community contributions (illustrative published notes ported from ac-guide) ──
  const contributions = loadOpt<ContributionRow[]>(dir, 'contributions', []);
  for (const c of contributions) {
    const data = {
      conferenceId, type: c.type, targetType: c.targetType, targetRef: c.targetRef,
      authorName: c.authorName ?? null, body: c.body, stance: c.stance ?? null, status: c.status,
      publishedAt: c.publishedAt ? new Date(c.publishedAt) : null,
      ...(c.createdAt ? { createdAt: new Date(c.createdAt) } : {}),
    };
    await prisma.contribution.upsert({ where: { id: c.id }, update: data, create: { id: c.id, ...data } });
  }
  console.log(`  ✓ Contributions: ${contributions.length}`);
}

async function main() {
  // ── Book of Discipline glossary (denomination-wide, shared across all tenants) ──
  // Short `excerpt` powers hover popovers; `fullText` (from the BoD PDF, keyed
  // by ¶ number) powers the full-paragraph reference page.
  const bod = load<BodRow[]>(ROOT, 'bod');
  const fullText = load<Record<string, string>>(ROOT, 'bod-fulltext');
  for (const p of bod) {
    const data = {
      title: p.title ?? null, excerpt: p.excerpt, fullText: fullText[String(p.number)] ?? null,
      source: p.source, edition: p.edition ?? '2020/2024',
    };
    await prisma.bodParagraph.upsert({ where: { number: p.number }, update: data, create: { number: p.number, ...data } });
  }
  console.log(`✓ BoD paragraphs: ${bod.length} (${Object.keys(fullText).length} with full text)`);

  // ── Tenants ──
  // Río Texas (tenant #1) reads from the seed-data root; each additional
  // conference reads from its own subdirectory.
  await seedConference({ slug: 'riotexas', name: 'Río Texas Annual Conference', disciplineEdition: '2020/2024', dir: ROOT });
  await seedConference({ slug: 'northgeorgia', name: 'North Georgia Annual Conference', disciplineEdition: '2020/2024', dir: join(ROOT, 'northgeorgia'), handbookUrl: '/handbook-ngc-2026.pdf', handbookLabel: '2026 NGC Session Handbook' });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
