import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { APEX } from "@/lib/host";

// Print-ready QR flyers, one full page per conference. Visit
// conferencefieldguide.org/flyers and print to PDF / paper (portrait, Letter).
export const dynamic = "force-dynamic";

const FEN = "#2c3e4a";
const INK = "#1a2128";
const REED = "#c9a86a";
const PARCHMENT = "#f7f3ec";

const PRINT_CSS = `
@page { size: letter portrait; margin: 0; }
.flyer { width: 8.5in; height: 11in; box-sizing: border-box; page-break-after: always;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 1in 0.9in; background: ${PARCHMENT}; color: ${INK}; }
.flyer:last-child { page-break-after: auto; }
.flyer-eyebrow { font-size: 22px; letter-spacing: 6px; text-transform: uppercase; color: ${REED}; font-weight: 600; }
.flyer-name { font-family: var(--font-eb-garamond), Georgia, serif; font-size: 52px; line-height: 1.1; color: ${FEN}; margin: 18px 0 6px; }
.flyer-tag { font-family: var(--font-eb-garamond), Georgia, serif; font-style: italic; font-size: 26px; color: ${FEN}; opacity: 0.85; }
.flyer-qr { width: 3.6in; height: 3.6in; margin: 0.5in 0; }
.flyer-qr svg { width: 100%; height: 100%; }
.flyer-cta { font-size: 24px; color: ${INK}; max-width: 5.5in; line-height: 1.4; }
.flyer-url { margin-top: 16px; font-family: var(--font-inter), system-ui, sans-serif; font-size: 22px; font-weight: 600; color: ${FEN}; }
.flyer-rule { width: 120px; height: 3px; background: ${REED}; margin: 22px 0; }
.flyer-foot { margin-top: 0.4in; font-size: 16px; letter-spacing: 3px; text-transform: uppercase; color: ${REED}; font-weight: 600; }
@media screen { body { background: #ddd; } .flyer { margin: 16px auto; box-shadow: 0 2px 18px rgba(0,0,0,.2); } }
`;

export default async function Flyers() {
  const conferences = await prisma.conference.findMany({ orderBy: { name: "asc" } });
  const flyers = await Promise.all(
    conferences.map(async (c) => {
      const url = `https://${c.slug}.${APEX}`;
      const svg = await QRCode.toString(url, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: INK, light: "#00000000" },
      });
      return { id: c.id, name: c.name, host: `${c.slug}.${APEX}`, svg };
    }),
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      {flyers.map((f) => (
        <section key={f.id} className="flyer">
          <div className="flyer-eyebrow">Field Guide</div>
          <h1 className="flyer-name">{f.name}</h1>
          <p className="flyer-tag">Understand it. Ask about it. Talk it through.</p>
          <div className="flyer-qr" dangerouslySetInnerHTML={{ __html: f.svg }} />
          <div className="flyer-rule" />
          <p className="flyer-cta">Scan to read the reports, ask questions, and prepare for Annual Conference.</p>
          <div className="flyer-url">{f.host}</div>
          <div className="flyer-foot">conferencefieldguide.org</div>
        </section>
      ))}
    </>
  );
}
