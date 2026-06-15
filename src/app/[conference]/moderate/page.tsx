import Link from "next/link";
import { getConference } from "@/lib/conference";
import { getViewer } from "@/lib/community";
import { TL, pendingQueue, pendingEdits, flaggedPublished, conferenceMembers } from "@/lib/moderation";
import { pick, type Lang } from "@/lib/lang";
import { langFor } from "@/lib/lang-server";
import { PendingItem, FlaggedItem, EditItem, MemberRow } from "./ModerationControls";
import { pathFor } from "@/lib/paths";

const fieldLabel = (lang: Lang, f: string): string =>
  ({ summary: pick(lang, "Summary", "Resumen"), contentMd: pick(lang, "Full text", "Texto completo") } as Record<string, string>)[f] ?? f ?? "text";

const trustLabel = (lang: Lang, l: number): string =>
  ([
    pick(lang, "Visitor", "Visitante"),
    pick(lang, "Member", "Miembro"),
    pick(lang, "Regular", "Habitual"),
    pick(lang, "Editor", "Editor"),
    pick(lang, "Steward", "Custodio"),
  ][l] ?? "");

const SECTION: Record<string, string> = { BODY: "agencies", AGENDA: "agenda", PROCESS: "process", ACTION: "actions", INFO: "information", PAGE: "page" };
const fmt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function ModeratePage({
  params,
}: {
  params: Promise<{ conference: string }>;
}) {
  const { conference } = await params;
  const conf = await getConference(conference);
  const viewer = await getViewer(conf.id);
  const lang = await langFor(conference);

  if (!viewer || viewer.trustLevel < TL.EDITOR) {
    return (
      <>
        <p className="eyebrow">{pick(lang, "Moderation", "Moderación")}</p>
        <h1>{pick(lang, "Steward’s desk", "Mesa de custodios")}</h1>
        <p className="muted">
          {viewer
            ? pick(lang, "This area is for conference editors and stewards. Ask a steward if you should have access.", "Esta área es para editores y custodios de la conferencia. Pregúntale a un custodio si deberías tener acceso.")
            : pick(lang, "Please sign in. This area is for conference editors and stewards.", "Por favor inicia sesión. Esta área es para editores y custodios de la conferencia.")}
        </p>
        {!viewer && (
          <p><Link href={`/login?next=/${conf.slug}/moderate`}>{pick(lang, "Sign in →", "Iniciar sesión →")}</Link></p>
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
      <p className="eyebrow">{pick(lang, "Moderation", "Moderación")} · {trustLabel(lang, viewer.trustLevel)}</p>
      <h1>{pick(lang, "Steward’s desk", "Mesa de custodios")}</h1>
      <p className="lede">
        {pick(lang,
          "Review what the community has submitted. Publishing puts it on the guide; rejecting keeps it off. Authors earn standing as their contributions are published and endorsed.",
          "Revisa lo que la comunidad ha enviado. Publicar lo agrega a la guía; rechazar lo mantiene fuera. Los autores ganan posición a medida que sus contribuciones se publican y se respaldan.")}
      </p>

      <section>
        <h2>{pick(lang, "In the queue", "En la cola")} {pending.length > 0 && <span className="pill">{pending.length}</span>}</h2>
        {pending.length === 0 ? (
          <p className="muted">{pick(lang, "Nothing waiting. The queue is clear.", "Nada pendiente. La cola está vacía.")}</p>
        ) : (
          <ul className="mod-list">
            {pending.map((c) => (
              <PendingItem
                key={c.id}
                lang={lang}
                conference={conf.slug}
                id={c.id}
                kind={c.type}
                stance={c.stance}
                body={c.body}
                author={c.author?.displayName ?? c.authorName ?? "Anonymous"}
                when={fmt(c.createdAt)}
                targetLabel={`${SECTION[c.targetType]} / ${c.targetRef}`}
                targetHref={pathFor(conf.slug, c.targetType, c.targetRef)}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>{pick(lang, "Proposed edits", "Ediciones propuestas")} {edits.length > 0 && <span className="pill">{edits.length}</span>}</h2>
        {edits.length === 0 ? (
          <p className="muted">{pick(lang, "No edits awaiting review.", "No hay ediciones por revisar.")}</p>
        ) : (
          <ul className="mod-list">
            {edits.map((e) => (
              <EditItem
                key={e.id}
                lang={lang}
                conference={conf.slug}
                id={e.id}
                fieldLabel={fieldLabel(lang, e.proposedField ?? "")}
                current={e.current}
                proposed={e.proposedText ?? ""}
                rationale={e.body}
                author={e.author?.displayName ?? e.authorName ?? "Anonymous"}
                when={fmt(e.createdAt)}
                targetLabel={`${SECTION[e.targetType]} / ${e.targetRef}`}
                targetHref={pathFor(conf.slug, e.targetType, e.targetRef)}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>{pick(lang, "Flagged", "Reportados")} {flagged.length > 0 && <span className="pill">{flagged.length}</span>}</h2>
        {flagged.length === 0 ? (
          <p className="muted">{pick(lang, "No open flags.", "Sin reportes abiertos.")}</p>
        ) : (
          <ul className="mod-list">
            {flagged.map((c) => (
              <FlaggedItem
                key={c.id}
                lang={lang}
                conference={conf.slug}
                id={c.id}
                body={c.body}
                author={c.author?.displayName ?? c.authorName ?? "Anonymous"}
                reasons={c.flags.map((f) => ({ by: f.profile.displayName, reason: f.reason }))}
                targetHref={pathFor(conf.slug, c.targetType, c.targetRef)}
              />
            ))}
          </ul>
        )}
      </section>

      {isSteward && (
        <section>
          <h2>{pick(lang, "Members & trust", "Miembros y confianza")}</h2>
          <p className="muted">
            {pick(lang,
              "Appoint editors (review the queue) and stewards (also set trust). Members reach Regular on their own as their work is endorsed.",
              "Nombra editores (revisan la cola) y custodios (también aplican la confianza). Los miembros alcanzan Habitual por su cuenta a medida que su trabajo es respaldado.")}
          </p>
          <ul className="mod-list">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                lang={lang}
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
