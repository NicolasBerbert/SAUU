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
        background: "#0a0a0a",
        surface: "#111111",
        "surface-2": "#181818",
        border: "#252525",
        "border-hover": "#3a3a3a",
        primary: "#f0ede8",
        muted: "#7a7a7a",
        accent: "#c8a96e",
        "accent-dark": "#b8945a",
        "accent-light": "#d4bb8a",
        danger: "#e05c5c",
        success: "#4caf7d",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
