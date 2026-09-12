/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8f4",
          100: "#d5efe6",
          200: "#aedfcb",
          300: "#7ac7ad",
          400: "#45a88a",
          500: "#2a8f72",
          600: "#1f735c",
          700: "#1a5c4b",
          800: "#174a3e",
          900: "#133d34",
        },
        sand: {
          50: "#f4f7f5",
          100: "#e8eeea",
          200: "#d0dbd4",
        },
        ink: {
          50: "#f6f7f6",
          900: "#14201c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 40px -18px rgba(20, 32, 28, 0.28)",
        lift: "0 18px 50px -20px rgba(26, 92, 75, 0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.06)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-in": "fade-in 0.6s ease-out both",
        "ken-burns": "ken-burns 18s ease-out forwards",
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "gradient-shift": "gradient-shift 12s ease infinite",
      },
    },
  },
  plugins: [],
};
