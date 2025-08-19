import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "#fafafa", // Pure white luxury
        foreground: "#1a1a1a", // Rich charcoal
        primary: {
          DEFAULT: "#c0c0c0", // Premium silver
          foreground: "#1a1a1a", // Dark text
        },
        secondary: {
          DEFAULT: "#d4af37", // Luxury gold
          foreground: "#1a1a1a", // Dark text
        },
        muted: {
          DEFAULT: "#f5f5f5", // Soft gray
          foreground: "#6b7280", // Muted text
        },
        accent: {
          DEFAULT: "#e8b4b8", // Rose gold accent
          foreground: "#1a1a1a", // Dark text
        },
        destructive: {
          DEFAULT: "#ef4444", // Clean red
          foreground: "#ffffff", // White text
        },
        border: "#e5e7eb", // Subtle border
        input: "#f9fafb", // Input background
        ring: "#c0c0c0", // Silver focus ring
        // Custom jewelry colors
        silver: {
          50: "#f8f9fa",
          100: "#f1f3f4",
          200: "#e8eaed",
          300: "#dadce0",
          400: "#bdc1c6",
          500: "#9aa0a6",
          600: "#80868b",
          700: "#5f6368",
          800: "#3c4043",
          900: "#202124",
        },
        // GoDaddy-inspired colors
        cyan: {
          50: "#ecfeff",
          100: "#cffafe", 
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        gold: {
          50: "#fefbf3",
          100: "#fdf6e3",
          200: "#f9ebc1",
          300: "#f4da94",
          400: "#ecc344",
          500: "#d4af37",
          600: "#b8941f",
          700: "#977818",
          800: "#7c5e19",
          900: "#68501a",
        },
        rosegold: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#e8b4b8",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
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
  plugins: [],
} satisfies Config;
