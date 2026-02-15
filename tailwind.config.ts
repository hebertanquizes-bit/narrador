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
        rpg: {
          dark: "#0d0f12",
          panel: "#151922",
          border: "#2a3142",
          muted: "#6b7280",
          gold: "#c9a227",
          accent: "#4f9cf9",
          success: "#22c55e",
          danger: "#ef4444",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
