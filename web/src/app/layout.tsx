import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n";
import { MotionProvider } from "@/components/site/motion-provider";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Film | Trading systems, AI agents and the tools around them",
  description:
    "Nuttapon Yimnoi (Film), Bangkok. Five systems in production: a gold trading terminal, an 11-agent AI fleet, dashboards and publishing automation, all built solo.",
  // update if Vercel assigns a different domain (or a custom domain later)
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Film | Trading systems, AI agents and the tools around them",
    description:
      "Five systems in production, all designed and built solo.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Film | Trading systems, AI agents and the tools around them",
    description:
      "Five systems in production, all designed and built solo.",
  },
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
      <body className="min-h-full bg-background text-foreground">
        <LocaleProvider>
          <MotionProvider>{children}</MotionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
