import Link from "next/link";
import { getConference } from "@/lib/conference";
import { getViewer } from "@/lib/community";
import { TL, pendingQueue, pendingEdits, flaggedPublished, conferenceMembers, TRUST_LABEL } from "@/lib/moderation";
import { PendingItem, FlaggedItem, EditItem, MemberRow } from "./ModerationControls";

const FIELD_LABEL: Record<string, string> = { summary: "Summary", contentMd: "Full text" };

const SECTION: Record<string, string> = { BODY: "agencies", AGENDA: "agenda", PROCESS: "process", ACTION: "actions", INFO: "information" };
const fmt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function ModeratePage({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const viewer = await getViewer(conf.id);

  if (!viewer || viewer.trustLevel < TL.EDITOR) {
    return (
      <>
        <p className="eyebrow">Moderation</p>
        <h1>Steward&rsquo;s desk</h1>
        <p className="muted">
          {viewer
            ? "This area is for conference editors and stewards. Ask a steward if you should have access."
            : "Please sign in. This area is for conference editors and stewards."}
        </p>
        {!viewer && (
          <p><Link href={`/login?next=/${conf.slug}/moderate`}>Sign in →</Link></p>
        )}
      </>
    );
  }

  const isSteward = viewer.trustLevel >= TL.STEWARD;
  const [pending, edits, flagged, members] = await Promise.all([
    pendingQueue(conf.id),
    pendingEdits(conf.id),
    flaggedPublished(conf.id),
    isSteward ? conferenceMembers(conf.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <p className="eyebrow">Moderation · {TRUST_LABEL[viewer.trustLevel]}</p>
      <h1>Steward&rsquo;s desk</h1>
      <p className="lede">
        Review what the community has submitted. Publishing puts it on the guide; rejecting keeps it
        off. Authors earn standing as their contributions are published and endorsed.
      </p>

      <section>
        <h2>In the queue {pending.length > 0 && <span className="pill">{pending.length}</span>}</h2>
        {pending.length === 0 ? (
          <p className="muted">Nothing waiting. The queue is clear.</p>
        ) : (
          <ul className="mod-list">
            {pending.map((c) => (
              <PendingItem
                key={c.id}
                conference={conf.slug}
                id={c.id}
                kind={c.type}
                stance={c.stance}
                body={c.body}
                author={c.author?.displayName ?? c.authorName ?? "Anonymous"}
                when={fmt(c.createdAt)}
                targetLabel={`${SECTION[c.targetType]} / ${c.targetRef}`}
                targetHref={`/${conf.slug}/${SECTION[c.targetType]}/${c.targetRef.split("#")[0]}`}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Proposed edits {edits.length > 0 && <span className="pill">{edits.length}</span>}</h2>
        {edits.length === 0 ? (
          <p className="muted">No edits awaiting review.</p>
        ) : (
          <ul className="mod-list">
            {edits.map((e) => (
              <EditItem
                key={e.id}
                conference={conf.slug}
                id={e.id}
                fieldLabel={FIELD_LABEL[e.proposedField ?? ""] ?? e.proposedField ?? "text"}
                current={e.current}
                proposed={e.proposedText ?? ""}
                rationale={e.body}
                author={e.author?.displayName ?? e.authorName ?? "Anonymous"}
                when={fmt(e.createdAt)}
                targetLabel={`${SECTION[e.targetType]} / ${e.targetRef}`}
                targetHref={`/${conf.slug}/${SECTION[e.targetType]}/${e.targetRef.split("#")[0]}`}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Flagged {flagged.length > 0 && <span className="pill">{flagged.length}</span>}</h2>
        {flagged.length === 0 ? (
          <p className="muted">No open flags.</p>
        ) : (
          <ul className="mod-list">
            {flagged.map((c) => (
              <FlaggedItem
                key={c.id}
                conference={conf.slug}
                id={c.id}
                body={c.body}
                author={c.author?.displayName ?? c.authorName ?? "Anonymous"}
                reasons={c.flags.map((f) => ({ by: f.profile.displayName, reason: f.reason }))}
                targetHref={`/${conf.slug}/${SECTION[c.targetType]}/${c.targetRef.split("#")[0]}`}
              />
            ))}
          </ul>
        )}
      </section>

      {isSteward && (
        <section>
          <h2>Members &amp; trust</h2>
          <p className="muted">
            Appoint editors (review the queue) and stewards (also set trust). Members reach Regular
            on their own as their work is endorsed.
          </p>
          <ul className="mod-list">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                conference={conf.slug}
                membershipId={m.id}
                name={m.profile.displayName}
                email={m.profile.email}
                trustLevel={m.trustLevel}
                reputation={m.reputation}
                isSelf={m.profileId === viewer.userId}
              />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
