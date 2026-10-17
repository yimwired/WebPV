import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n";
import { MotionProvider } from "@/components/site/motion-provider";
import "./globals.css";
import { withCounts } from "@/lib/counts";
import { SITE_URL } from "@/lib/site";
import { jsonLdHtml, siteGraph } from "@/lib/structured-data";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
// the theme the visitor is actually on; the dark value matches --background in
// the .dark block, the light one matches :root.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
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
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint, so a visitor who chose light never sees the
            dark page flash first. <html> already carries `dark`, so this only
            has to take it off. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.remove('dark')}catch(e){}",
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
