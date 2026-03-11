import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "World Monitor",
  description: "Map-first global monitoring terminal",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-terminal-bg text-terminal-text font-mono antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
