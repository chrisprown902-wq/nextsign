import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Claude × Wise Green palette
        parchment: "#f5f4ed",
        ink: "#141413",
        "wise-green": "#9fe870",
        "dark-green": "#163300",
        "mint-surface": "#b8e994",
        "pastel-hover": "#8de07a",
        "olive-gray": "#5e5d59",
        "stone-gray": "#87867f",
        "border-cream": "#f0eee6",
        "dark-surface": "#30302e",
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
        tag: "24px",
      },
      boxShadow: {
        ring: "0 0 0 1px rgba(0,0,0,0.06)",
        whisper: "0 4px 24px rgba(0,0,0,0.05)",
        "ring-warm": "0 0 0 1px rgba(0,0,0,0.08)",
      },
      lineHeight: {
        tight: "1.10",
        relaxed: "1.60",
      },
      letterSpacing: {
        body: "0.01em",
      },
    },
  },
  plugins: [],
};

export default config;
