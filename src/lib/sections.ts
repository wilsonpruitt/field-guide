import GithubSlugger from "github-slugger";

export type Section = { title: string; slug: string };

// Extract the headings of a markdown body as {title, slug}. Slugs match what
// rehype-slug produces in the rendered content, so a note anchored to a slug
// lines up with that heading's inline marker.
export function extractSections(md: string): Section[] {
  const slugger = new GithubSlugger();
  const out: Section[] = [];
  for (const line of md.split("\n")) {
    const m = /^#{2,4}\s+(.+?)\s*$/.exec(line);
    if (m) {
      const title = m[1].replace(/[*_`]/g, "").trim();
      out.push({ title, slug: slugger.slug(title) });
    }
  }
  return out;
}
