import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F6F2",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#1E293B",
          hover: "#0F172A",
          foreground: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#18181B",
          muted: "#71717A",
          light: "#A1A1AA",
        },
        subtle: "#E4E4E7",
        service: {
          DEFAULT: "#0284C7",
          bg: "#E0F2FE",
        },
        goods: {
          DEFAULT: "#4F46E5",
          bg: "#E0E7FF",
        },
        status: {
          balance: "#15803D",
          "balance-bg": "#DCFCE7",
          warning: "#B45309",
          "warning-bg": "#FEF3C7",
          danger: "#B91C1C",
          "danger-bg": "#FEE2E2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
