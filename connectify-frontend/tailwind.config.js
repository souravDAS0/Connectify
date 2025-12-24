/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "music-bar": {
          "0%, 100%": { height: "25%" },
          "50%": { height: "100%" },
        },
      },
      animation: {
        "music-bar-1": "music-bar 1.2s ease-in-out infinite",
        "music-bar-2": "music-bar 1.2s ease-in-out 0.2s infinite",
        "music-bar-3": "music-bar 1.2s ease-in-out 0.4s infinite",
      },
    },
  },
  plugins: [],
};
