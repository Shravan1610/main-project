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
          bg: "#0a0e17",
          surface: "#111827",
          border: "#1e293b",
          green: "#00ff88",
          "green-dim": "#00cc6a",
          cyan: "#00e5ff",
          amber: "#ffb800",
          red: "#ff3b5c",
          text: "#e2e8f0",
          "text-dim": "#94a3b8",
          "text-muted": "#64748b",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 255, 136, 0.15)",
        "glow-cyan": "0 0 20px rgba(0, 229, 255, 0.15)",
        "glow-amber": "0 0 20px rgba(255, 184, 0, 0.15)",
        "glow-red": "0 0 20px rgba(255, 59, 92, 0.15)",
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
