import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Brand palette extracted from the Dorika logo
        charcoal: {
          DEFAULT: "#24272B",
          50: "#f5f6f7",
          100: "#e6e7e9",
          200: "#c3c6ca",
          300: "#9ea3a9",
          400: "#6b7177",
          500: "#474c52",
          600: "#34383d",
          700: "#24272B",
          800: "#1b1e21",
          900: "#121416",
        },
        terracotta: {
          DEFAULT: "#C55A29",
          50: "#fdf4ef",
          100: "#fae3d5",
          200: "#f4c2a4",
          300: "#ed9a6d",
          400: "#e07844",
          500: "#C55A29",
          600: "#a9481f",
          700: "#89391b",
          800: "#6f301b",
          900: "#5c2a19",
        },
        cream: {
          DEFAULT: "#FBF8F4",
          100: "#FFFDFB",
          200: "#FBF8F4",
          300: "#F3ECE3",
        },
        whatsapp: "#25D366",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Nunito", "system-ui", "sans-serif"],
        display: ["var(--font-quicksand)", "Quicksand", "var(--font-nunito)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 14px -4px rgba(36, 39, 43, 0.12)",
        card: "0 6px 24px -10px rgba(36, 39, 43, 0.18)",
        float: "0 10px 30px -6px rgba(37, 211, 102, 0.55)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      keyframes: {
        "wa-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(37, 211, 102, 0.55)" },
          "70%": { boxShadow: "0 0 0 18px rgba(37, 211, 102, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(37, 211, 102, 0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "wa-pulse": "wa-pulse 2s infinite",
        "fade-up": "fade-up 0.6s ease-out both",
        "fade-in": "fade-in 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
