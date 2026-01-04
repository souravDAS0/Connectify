/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "music-bar": {
          "0%, 100%": { height: "4px" },
          "50%": { height: "16px" },
        },
        "music-bar-lg": {
          "0%, 100%": { height: "6px" },
          "50%": { height: "24px" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "music-bar-1": "music-bar 1.2s ease-in-out infinite",
        "music-bar-2": "music-bar 1.2s ease-in-out 0.2s infinite",
        "music-bar-3": "music-bar 1.2s ease-in-out 0.4s infinite",
        "music-bar-lg-1": "music-bar-lg 1.2s ease-in-out infinite",
        "music-bar-lg-2": "music-bar-lg 1.2s ease-in-out 0.2s infinite",
        "music-bar-lg-3": "music-bar-lg 1.2s ease-in-out 0.4s infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
