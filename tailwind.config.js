/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7fb",
          100: "#ececf2",
          200: "#d2d2dc",
          300: "#9d9dac",
          400: "#6c6c7c",
          500: "#48485a",
          600: "#2f2f3f",
          700: "#1d1d2a",
          800: "#13131c",
          900: "#0a0a13",
          950: "#05050a",
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
          950: "#0d2a4c",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
        teal: {
          400: "#2dd4bf",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(8,10,20,0.4), 0 8px 24px rgba(8,10,20,0.5)",
        glow: "0 0 0 1px rgba(139,92,246,0.35), 0 8px 32px rgba(139,92,246,0.25)",
        "glow-cyan": "0 0 0 1px rgba(34,211,238,0.3), 0 8px 32px rgba(34,211,238,0.2)",
        ring: "0 0 0 1px rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "aurora":
          "radial-gradient(60% 60% at 20% 10%, rgba(139,92,246,0.35), transparent 60%), radial-gradient(50% 50% at 90% 20%, rgba(34,211,238,0.30), transparent 60%), radial-gradient(70% 60% at 50% 100%, rgba(45,212,191,0.20), transparent 60%)",
        "grid-fade":
          "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
        "shimmer":
          "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.0) 60%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "blob-1": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(40px,-30px) scale(1.08)" },
          "66%": { transform: "translate(-30px,20px) scale(0.95)" },
        },
        "blob-2": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(-50px,40px) scale(0.9)" },
          "66%": { transform: "translate(20px,-40px) scale(1.1)" },
        },
        "blob-3": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(30px,30px) scale(1.05)" },
        },
        "shimmer-x": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(220%)" },
        },
        "ping-soft": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "tilt": {
          "0%, 100%": { transform: "rotate(-0.5deg)" },
          "50%": { transform: "rotate(0.5deg)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        "blob-1": "blob-1 18s ease-in-out infinite",
        "blob-2": "blob-2 22s ease-in-out infinite",
        "blob-3": "blob-3 26s ease-in-out infinite",
        "shimmer-x": "shimmer-x 2.6s linear infinite",
        "scanline": "scanline 2.4s ease-in-out infinite",
        "ping-soft": "ping-soft 1.6s cubic-bezier(0, 0, 0.2, 1) infinite",
        "tilt": "tilt 8s ease-in-out infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        "spin-slow": "spin-slow 14s linear infinite",
      },
    },
  },
  plugins: [],
};
