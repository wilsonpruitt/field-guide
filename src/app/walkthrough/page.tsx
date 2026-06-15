import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WALKTHROUGH } from "@/content/walkthrough";

export const metadata: Metadata = {
  title: "Field Guide — a walkthrough",
  description: "How Field Guide works: understanding conference, the community layer, trust, moderation, and what's possible.",
};

export default function WalkthroughPage() {
  return (
    <main className="fg-main">
      <p className="eyebrow"><Link href="/">Field Guide</Link></p>
      <article className="walkthrough">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{WALKTHROUGH}</ReactMarkdown>
      </article>
    </main>
  );
}
