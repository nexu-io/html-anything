import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full bg-[var(--paper)] text-[var(--ink)] selection:bg-[var(--coral)]/30"
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){var t=null;try{t=localStorage.getItem("html-anything-theme")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;})();',
          }}
        />
        {children}
      </body>
    </html>
  );
}
