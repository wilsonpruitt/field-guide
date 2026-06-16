import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

// Shared, host-independent OG card generator. Referenced from metadata as
// /api/og?conf=<slug>. /api is a proxy passthrough, so it works on the apex
// and every conference subdomain without rewriting.
export const runtime = "nodejs";

const FEN = "#2c3e4a";
const PARCHMENT = "#f7f3ec";
const REED = "#c9a86a";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("conf");
  const conf = slug
    ? await prisma.conference.findUnique({ where: { slug }, select: { name: true } }).catch(() => null)
    : null;

  const title = conf?.name ?? "Field Guide";
  const tagline = conf
    ? "Understand it. Ask about it. Talk it through."
    : "A community field guide to annual conference.";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: FEN,
          padding: "80px 90px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 30,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: REED,
              fontWeight: 600,
            }}
          >
            Field Guide
          </div>
          <div
            style={{
              marginTop: 36,
              fontSize: 80,
              lineHeight: 1.05,
              color: PARCHMENT,
              fontWeight: 600,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ height: 4, width: 160, background: REED, marginBottom: 28 }} />
          <div style={{ fontSize: 38, color: PARCHMENT, opacity: 0.82 }}>{tagline}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
