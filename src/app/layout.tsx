import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-sans",
  weight: "300 600",
  display: "swap",
});

const interTight = localFont({
  src: "./fonts/inter-tight-latin.woff2",
  variable: "--font-display",
  weight: "400 900",
  display: "swap",
});

const playfair = localFont({
  src: [
    {
      path: "./fonts/playfair-display-latin.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "./fonts/playfair-display-italic-latin.woff2",
      weight: "400 700",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});

const mono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  variable: "--font-mono",
  weight: "400 500",
  display: "swap",
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
