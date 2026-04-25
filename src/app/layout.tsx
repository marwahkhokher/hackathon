import "./globals.css";
import type { Metadata } from "next";

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
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
