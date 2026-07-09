import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Film — Builder of bots, tools & content",
  description:
    "Personal site of Film. Trading systems, AI assistants, dashboards, and content — built end to end.",
  // update if Vercel assigns a different domain (or a custom domain later)
  metadataBase: new URL("https://webpv.vercel.app"),
  openGraph: {
    title: "Film — Builder of bots, tools & content",
    description:
      "Trading systems, AI assistants, dashboards, and content — built end to end.",
    type: "website",
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
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
