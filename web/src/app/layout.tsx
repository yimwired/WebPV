import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Google_Sans, Playpen_Sans_Thai } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n";
import { MotionProvider } from "@/components/site/motion-provider";
import "./globals.css";
import { withCounts } from "@/lib/counts";
import { SITE_URL } from "@/lib/site";
import { jsonLdHtml, siteGraph } from "@/lib/structured-data";

// Still the root face, because a dozen labs inherit it and each lab is a style
// study that is not ours to restyle. The site's own pages use the two below.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The site's own face. It carries Thai as well as Latin, so Thai copy no
// longer falls back to whatever the visitor's OS has.
const googleSans = Google_Sans({
  variable: "--font-site",
  subsets: ["latin", "thai"],
});

// The handwriting: the margin notes, the hero's and the ones written beside the
// crossed-out worries. `block` rather than `swap`, because the fallback for
// `cursive` on Windows is Comic Sans, and a note that appears a moment late
// beats a note that changes face.
const playpen = Playpen_Sans_Thai({
  variable: "--font-hand",
  subsets: ["latin", "thai"],
  display: "block",
});

const SITE_TITLE = "Film | Websites you can try before you hire";
const SHARE_DESCRIPTION = withCounts(
  "{labs} live examples to try first, then yours, built solo from the first call to launch.",
);

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: withCounts(
    "Nuttapon Yimnoi (Film), Bangkok. Websites in Next.js and React, with {labs} live examples you can try before you hire. Built solo, end to end.",
  ),
  // the one place the host is set: SITE_URL in lib/site.ts
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: SITE_TITLE,
    description: SHARE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SHARE_DESCRIPTION,
  },
};

// The phone paints its own bar with this colour. Two entries so the bar follows
// the visitor's system setting; the dark value matches --background in the
// .dark block, the light one matches :root.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d1734" },
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${googleSans.variable} ${playpen.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint, so a visitor who chose dark never sees the
            light page flash first. Light is the default since 2026-10-17, so
            this only ever has to add `dark`. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        {/* Who built this and what it is, stated to crawlers in a form
            they parse rather than infer. Rendered at build time. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(siteGraph) }}
        />
        <LocaleProvider>
          <MotionProvider>{children}</MotionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
