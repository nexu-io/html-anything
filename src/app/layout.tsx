import type { Metadata } from "next";
import { Inter, Inter_Tight, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const interTight = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["italic", "normal"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "HTML Anything — the agentic HTML editor",
  description:
    "Markdown is the draft; HTML is what humans read. Your local AI agent writes HTML directly — decks, resumes, posters, knowledge cards, data reports, Hyperframes videos — one click to WeChat / X / Zhihu.",
  metadataBase: new URL("https://html-anything.app"),
  openGraph: {
    title: "HTML Anything — the agentic HTML editor",
    description: "Markdown is the draft. HTML is what humans read. Your local agent writes it.",
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
      className={`${inter.variable} ${interTight.variable} ${playfair.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-[var(--paper)] text-[var(--ink)] selection:bg-[var(--coral)]/30"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
