import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "rgb(var(--terminal-bg) / <alpha-value>)",
          surface: "rgb(var(--terminal-surface) / <alpha-value>)",
          border: "rgb(var(--terminal-border) / <alpha-value>)",
          green: "rgb(var(--terminal-green) / <alpha-value>)",
          "green-dim": "rgb(var(--terminal-green-dim) / <alpha-value>)",
          cyan: "rgb(var(--terminal-cyan) / <alpha-value>)",
          amber: "rgb(var(--terminal-amber) / <alpha-value>)",
          red: "rgb(var(--terminal-red) / <alpha-value>)",
          text: "rgb(var(--terminal-text) / <alpha-value>)",
          "text-dim": "rgb(var(--terminal-text-dim) / <alpha-value>)",
          "text-muted": "rgb(var(--terminal-text-muted) / <alpha-value>)",
        },
      },
      fontFamily: {
        mono: [
          "'SFMono-Regular'",
          "'Menlo'",
          "'Monaco'",
          "'JetBrains Mono'",
          "'Fira Code'",
          "ui-monospace",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 10px 28px rgba(3, 7, 18, 0.38), 0 1px 0 rgba(255, 255, 255, 0.03) inset",
        "glow-cyan": "0 10px 28px rgba(7, 14, 24, 0.4), 0 1px 0 rgba(255, 255, 255, 0.03) inset",
        "glow-amber": "0 10px 28px rgba(18, 13, 7, 0.36), 0 1px 0 rgba(255, 255, 255, 0.03) inset",
        "glow-red": "0 10px 28px rgba(20, 9, 10, 0.34), 0 1px 0 rgba(255, 255, 255, 0.03) inset",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "scan-line": "scan-line 8s linear infinite",
        "fade-in-up": "fade-in-up 0.3s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
