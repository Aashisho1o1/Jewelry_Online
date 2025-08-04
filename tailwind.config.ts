import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "#f8f9fa", // Light Gray
        foreground: "#212529", // Dark Gray
        primary: {
          DEFAULT: "#2a9d8f", // Green
          foreground: "#ffffff", // White
        },
        secondary: {
          DEFAULT: "#e9c46a", // Yellow
          foreground: "#212529", // Dark Gray
        },
        muted: {
          DEFAULT: "#e9ecef", // Light Gray
          foreground: "#6c757d", // Gray
        },
        accent: {
          DEFAULT: "#f4a261", // Orange
          foreground: "#212529", // Dark Gray
        },
        destructive: {
          DEFAULT: "#e76f51", // Red
          foreground: "#ffffff", // White
        },
        border: "#dee2e6", // Gray
        input: "#ced4da", // Gray
        ring: "#2a9d8f", // Green
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
