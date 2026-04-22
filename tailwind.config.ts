import type { Config } from "tailwindcss";

/**
 * Tailwind configuration tuned to match the Infosys Coding Hands-on
 * visual language: white panels, soft gray borders, the signature
 * Infosys teal/cyan accent used for active tabs and primary buttons.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Infosys signature teal (sampled from the active "Case 1" tab pill)
        infy: {
          50: "#E6FAF8",
          100: "#C0F2EC",
          200: "#8BE6DB",
          300: "#4FD5C5",
          400: "#1FC4B0",
          500: "#00B4A6", // primary teal
          600: "#00958A",
          700: "#007A72",
          800: "#005F59",
          900: "#004842",
        },
        // Problem-panel background is an almost-white with a cool tint
        panel: "#FAFBFC",
        panelBorder: "#E5E7EB",
        editorBg: "#1E1E1E",
        editorGutter: "#1E1E1E",
        consoleBg: "#F4F5F7",
        watermark: "rgba(120, 120, 140, 0.06)",
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Helvetica Neue"', "Arial", "sans-serif"],
        mono: ['"Fira Code"', "Consolas", '"Courier New"', "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03)",
        tab: "inset 0 -2px 0 0 #00B4A6",
      },
    },
  },
  plugins: [],
};

export default config;
