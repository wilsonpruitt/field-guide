# Field Guide — a walkthrough

**Live:** https://field-guide-hazel.vercel.app · Tenant #1: the Río Texas Annual Conference (`/riotexas`)

Field Guide is a community guide to annual conference. It does three things, in this order of priority: **help people understand** what conference is and does, **let them ask** about anything that's unclear, and **surface where people stand** on what's being decided — in English and Spanish. It's a multi-conference platform; Río Texas is the first tenant, and everything is built to scale to others.

This document explains what's there today, what moderation looks like, and what's possible next.

---

## 1. The public experience — understanding conference

Everything below is open to anyone, no account required. Each conference lives at its own path (`/riotexas`), with a top nav.

- **This year's schedule** (`/riotexas/schedule`) — the full June 17–20 timeline, hour by hour. Business and votes are highlighted; worship, meals, and logistics read quieter. Items that decide something link straight to the explainer for what they are.
- **Up for a vote** (`/riotexas/actions`) — the reports and resolutions conference is actually asked to approve, pulled from the pre-conference report's "For Conference Action" sections (plus the June 10 addendum and errata). Standing Rules, Finance, Pensions, the immigrant-solidarity and transgender sacred-worth resolutions, the historic-site designation — 10 items, each with full text, plain summary, and the Book of Discipline references it cites.
- **Reports for information** (`/riotexas/information`) — the 20 "For Information Only" reports. These are where a lot gets lost in the volume, so each one is explained in plain language with the full text underneath.
- **The agenda** (`/riotexas/agenda`), **Agencies** (`/riotexas/agencies`), **How it works** (`/riotexas/process`), **Motions** (`/riotexas/motions`) — the evergreen spine: who does what, how membership and the consent agenda and resolutions and floor motions work, and an interactive parliamentary helper ("what do you want to do?" → what to say, whether it's debatable, the vote required).
- **The Book of Discipline** (`/riotexas/discipline`) — every paragraph the guide cites, in full. Any "¶604" reference across the site shows a hover popover and links to the complete paragraph here.

**Bilingual.** A EN/ES toggle in the header switches all report and resolution content to Spanish, using the conference's own published translations (we never machine-translate). The app's menus and labels are still English for now — that's a planned follow-up; the *content* people read is what's bilingual today.

---

## 2. The community layer — asking and weighing in

On every body, agenda item, process page, action item, and information report, anyone can take part:

- **Ask a question** — "What does this actually mean?" Answers thread underneath.
- **Share a note or perspective** — add context, a concern, a clarification.
- **On things up for a vote**, perspectives are organized by **where people stand**: In favor · Concerns · Clarifications · Alternatives. This is the heart of it — not a yes/no poll, but the range of considered views, attributed and readable.
- **Endorse** a helpful contribution, or **flag** one that's off.

Anyone can contribute. Signed-out contributions are always reviewed before they appear. Signing in (a simple email magic-link — no password) lets you build standing in a conference over time.

---

## 3. Trust — how standing is earned

Standing is **per conference**, not global. Five tiers:

| Tier | Who | What they can do |
|------|-----|------------------|
| **Visitor / Member** (0–1) | new or signed-in | contribute; everything is reviewed first |
| **Regular** (2) | earned automatically | contributions auto-publish (no queue) |
| **Editor** (3) | appointed | also reviews the moderation queue |
| **Steward** (4) | appointed | also appoints trust and applies edits |

Members reach **Regular on their own**: when their published contributions are endorsed as helpful, they earn reputation, and at a threshold they're promoted automatically. Editor and Steward are **appointed by a steward** — judgment, not just volume. The first steward of a conference is granted by hand (`pnpm grant-trust <email> riotexas 4`); after that it's all in-app.

---

## 4. What moderation looks like — the Steward's desk

Editors and Stewards get a **Steward's desk** (`/riotexas/moderate`) in their nav; nobody else sees it, and every action re-checks trust on the server, not just in the UI. It has four sections:

1. **In the queue** — every pending question, note, and perspective, with its target and author. One click to **Publish** (it goes on the guide and the author earns reputation) or **Reject**.
2. **Proposed edits** — suggested changes to the guide's own text, shown as a **before/after**: the current text beside the proposed text. **Apply** writes the new text straight into the guide and credits the author; **Reject** sets it aside. (More on this below.)
3. **Flagged** — published items someone reported, with the reasons. **Dismiss the flags** or **Unpublish**.
4. **Members & trust** (Stewards only) — see each member's reputation and **appoint** them Editor or Steward.

The whole point: the official spine stays trustworthy because a person decides, while the community does the heavy lifting of surfacing questions and perspectives. Nothing from the public reaches the published guide without a steward's nod, and stewards can act in seconds.

---

## 5. A living guide — wiki edit-proposals

The spine isn't read-only. On any page, a signed-in member can **"Suggest an edit"** — pick a field (a summary, or the full text), edit the current wording in place, and add a note on why. It's always queued (even for Regulars — the canonical text is shared), and a steward sees the before/after diff and applies or rejects it. Over time the guide gets more accurate because the people who know correct it, with a steward in the loop.

---

## 6. What's possible from here

The foundation — multi-tenant, role-aware, bilingual, with a full contribute→review→publish→edit lifecycle — opens several directions:

- **More conferences.** Río Texas is tenant #1; a second conference is a row in the database plus its spine, not a fork. Each gets its own community, stewards, and trust.
- **Finish the Spanish shell.** Content is bilingual now; translating the menus, headings, and buttons is a contained next step.
- **The long tail of reports.** We ingested the 20 formally-flagged information reports; the ~10–12 non-bannered sections (seminaries, congregational vitality) can be added.
- **Gamification & recognition.** Reputation already drives auto-promotion; it can power leaderboards, badges, and "trusted answerer" signals to encourage good participation.
- **Custom domains** per conference, and — when Field Guide is at parity and you're ready — a deliberate cutover of `guide.wrootlabs.com` from the current Astro guide to this.
- **Real-time during session.** Because the schedule and votes are structured data, the guide could light up live during plenary — what's happening now, what just passed.

---

## Status & the one thing left for launch

Live in production, deployed as its own Vercel project (the existing Astro guide at `guide.wrootlabs.com` is untouched and still the fallback). Public reading works today.

**To turn on sign-in / moderation in production:** add the production URL to Supabase → Authentication → URL Configuration — Site URL and the redirect allow-list need `https://field-guide-hazel.vercel.app/**`. Then sign in once and run `pnpm grant-trust <your-email> riotexas 4` to become the first steward.
