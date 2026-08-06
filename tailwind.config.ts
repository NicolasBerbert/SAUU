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
        background: "#E3E2DE",
        surface: "#ECEAE4",
        "surface-2": "#d8d6cf",
        border: "#C8C6C0",
        "border-hover": "#A9A7A1",
        primary: "#32312f",
        muted: "#7C7A76",
        accent: "#A73E2F",
        "accent-dark": "#8a3225",
        "accent-light": "#c45748",
        tan: "#A99277",
        sage: "#8C9673",
        danger: "#e05c5c",
        success: "#8C9673",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "'Times New Roman'", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
 