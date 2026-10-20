import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",
        muted: "#555555",
        line: "#0a0a0a",
        canvas: "#f5f5f0",
        card: "#ffffff",
        accent: "#0000ff",
        error: "#cc0000",
        success: "#006400",
        warn: "#b36200",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #0a0a0a",
        "brutal-sm": "2px 2px 0px 0px #0a0a0a",
        "brutal-accent": "4px 4px 0px 0px #0000ff",
        "brutal-lg": "6px 6px 0px 0px #0a0a0a",
      },
      borderRadius: {
        DEFAULT: "0px",
        none: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "0px",
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
      }
    }
  },
  plugins: []
};
export default config;
