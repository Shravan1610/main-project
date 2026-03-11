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
          bg: "#0f1115",
          surface: "#161a22",
          border: "#2a3140",
          green: "#84dba0",
          "green-dim": "#6fc08b",
          cyan: "#88c6f5",
          amber: "#e9bc74",
          red: "#ea7b78",
          text: "#d8dee9",
          "text-dim": "#a5afc1",
          "text-muted": "#7f899f",
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
      },
    },
  },
  plugins: [],
};

export default config;
