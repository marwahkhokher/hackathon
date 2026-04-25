/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#ebebef",
          200: "#d4d4dc",
          300: "#aaaab5",
          400: "#7c7c8a",
          500: "#56565f",
          600: "#3c3c44",
          700: "#27272d",
          800: "#181820",
          900: "#0c0c12",
          950: "#06060a"
        },
        accent: {
          50: "#eef9ff",
          100: "#d9f1ff",
          200: "#b9e7ff",
          300: "#85d6ff",
          400: "#48bbff",
          500: "#1f9bff",
          600: "#0a7af2",
          700: "#0a61c4",
          800: "#11519c",
          900: "#13447b",
          950: "#0d2a4c"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)",
        glow: "0 0 0 1px rgba(31,155,255,0.25), 0 8px 32px rgba(31,155,255,0.18)"
      }
    },
  },
  plugins: [],
};
