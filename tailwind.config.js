/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6C63FF",
          600: "#5B52E0",
          700: "#4640B8",
          800: "#3730A3",
          900: "#312E81",
        },
        secondary: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          400: "#FB923C",
          500: "#FF6B35",
          600: "#EA580C",
        },
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          400: "#4ADE80",
          500: "#58CC02",
          600: "#16A34A",
        },
        danger: {
          50: "#FFF1F2",
          100: "#FFE4E6",
          400: "#F87171",
          500: "#FF4B4B",
          600: "#DC2626",
        },
        gold: {
          400: "#FACC15",
          500: "#EAB308",
          600: "#CA8A04",
        },
        surface: "#F8F9FF",
        card: "#FFFFFF",
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
    },
  },
  plugins: [],
};
