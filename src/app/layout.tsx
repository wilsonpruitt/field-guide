import type { Metadata } from "next";
import { headers } from "next/headers";
import { EB_Garamond, Inter } from "next/font/google";
import "./globals.css";

const garamond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Per-host metadataBase so OG/Twitter image URLs resolve absolutely on the
// apex and on every conference subdomain.
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") ?? "conferencefieldguide.org";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: { default: "Field Guide", template: "%s · Field Guide" },
    description: "A community field guide to annual conference.",
    openGraph: {
      title: "Field Guide",
      description: "A community field guide to annual conference.",
      siteName: "Field Guide",
      type: "website",
      images: ["/api/og"],
    },
    twitter: { card: "summary_large_image", images: ["/api/og"] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${garamond.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
