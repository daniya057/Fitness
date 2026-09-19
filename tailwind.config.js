/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFFFF",
        card: "#F8F9FA",
        accent: "#2E7D32",
        "accent-soft": "#E8F5E9",
        mint: "#C9EBD6",
        ink: "#1A1A1A",
        mute: "#666666",
      },
      borderRadius: {
        panel: "20px",
        pill: "24px",
      },
    },
  },
  plugins: [],
};
