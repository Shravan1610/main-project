import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/features/ui-theme/styles/terminal.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GreenTrust Intelligence Terminal",
  description: "Live risk, evidence, document, and verification command center",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-terminal-bg text-terminal-text font-mono antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
