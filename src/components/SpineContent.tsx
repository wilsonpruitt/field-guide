import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import type { Lang } from "@/lib/lang";
import { pick } from "@/lib/lang";

export type Anchors = Record<string, { count: number; firstId: string }>;

// Renders spine markdown and, where a heading's slug has community notes
// attached (e.g. a note targeting "finance#district-funding"), shows an inline
// marker by that heading linking down to the note — true marginalia.
export default function SpineContent({
  content,
  anchors = {},
  lang = "en",
}: {
  content: string;
  anchors?: Anchors;
  lang?: Lang;
}) {
  const heading = (Tag: "h2" | "h3" | "h4") =>
    function Heading({ id, children }: { id?: string; children?: React.ReactNode }) {
      const a = id ? anchors[id] : undefined;
      return (
        <Tag id={id}>
          {children}
          {a && (
            <a
              className="anno-marker"
              href={`#c-${a.firstId}`}
              title={pick(lang, `${a.count} note(s) on this section`, `${a.count} nota(s) sobre esta sección`)}
            >
              💬 {a.count}
            </a>
          )}
        </Tag>
      );
    };

  return (
    <article>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{ h2: heading("h2"), h3: heading("h3"), h4: heading("h4") }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
