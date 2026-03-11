import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import { Providers } from "./providers";

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "GreenTrust",
  description: "Map-first sustainable finance intelligence platform",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={firaCode.variable}>
      <body className="min-h-screen bg-terminal-bg text-terminal-text font-mono antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
