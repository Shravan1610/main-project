import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/features/ui-theme/styles/terminal.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Automated Evidence Collection System",
  description: "AI-powered terminal workspace for evidence discovery, compliance monitoring, and claim traceability",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-terminal-bg text-terminal-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
