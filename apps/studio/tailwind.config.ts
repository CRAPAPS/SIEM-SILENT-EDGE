import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:          "var(--bg)",
        "bg-2":      "var(--bg-2)",
        "bg-3":      "var(--bg-3)",
        fg:          "var(--fg)",
        muted:       "var(--muted)",
        border:      "var(--border)",
        accent:      "var(--accent)",
        "sev-info":  "var(--sev-info)",
        "sev-warn":  "var(--sev-warn)",
        "sev-alert": "var(--sev-alert)",
        "sev-ok":    "var(--sev-ok)",
        "sev-crit":  "var(--sev-crit)",
      },
      fontFamily: {
        sans: ["var(--sans)"],
        mono: ["var(--mono)"],
      },
      borderRadius: {
        none:    "0px",
        DEFAULT: "2px",
        sm:      "2px",
        md:      "3px",
        lg:      "4px",
        // Intentionally no xl/2xl/3xl/full — sharp corners are the design law
      },
      fontSize: {
        "soc-xs": ["10px", { lineHeight: "1.4", letterSpacing: "0.08em" }],
        "soc-sm": ["11px", { lineHeight: "1.5", letterSpacing: "0.06em" }],
        "soc-md": ["12px", { lineHeight: "1.6", letterSpacing: "0.04em" }],
      },
      animation: {
        "blink":  "blink 1s step-end infinite",
        "ticker": "ticker 40s linear infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [forms],
};

export default config;
