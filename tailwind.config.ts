import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Base surfaces — clean white/light gray
        base: "#F7F8FA",
        surface: "#FFFFFF",
        elevated: "#F0F2F5",
        hover: "#E8EBF0",

        // Borders
        border: {
          subtle: "#E8EBF0",
          default: "#D1D5DB",
        },

        // Text
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },

        // Accent — a calm, trustworthy blue
        accent: {
          DEFAULT: "#c83771ff",
          light: "#cd4c7f",
          dim: "#ffd8e8",
        },

        // Income (green)
        income: {
          DEFAULT: "#059669",
          light: "#10B981",
          bg: "#ECFDF5",
          border: "#A7F3D0",
        },

        // Bill (rose/red)
        bill: {
          DEFAULT: "#DC2626",
          light: "#EF4444",
          bg: "#FEF2F2",
          border: "#FECACA",
        },

        // Warning
        warning: {
          DEFAULT: "#D97706",
          light: "#F59E0B",
          bg: "#FFFBEB",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { transform: "translateY(12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          from: { transform: "translateY(-6px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          from: { transform: "scale(0.97)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
