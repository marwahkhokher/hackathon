import "./globals.css";
import type { Metadata } from "next";
import { AmbientBackground } from "@/components/AmbientBackground";

export const metadata: Metadata = {
  title: "The AI Scientist — from hypothesis to runnable plan",
  description:
    "Convert a natural-language scientific hypothesis into a complete, operationally realistic experiment plan a real lab could execute on Monday.",
  metadataBase: new URL("https://ai-scientist.example"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="relative min-h-screen overflow-x-hidden">
        <AmbientBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
