/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      colors: {
        netflix: {
          red: "#E50914",
          black: "#141414",
          dark: "#181818",
          gray: "#808080",
          light: "#E5E5E5",
        },
      },
    },
  },
  plugins: [],
};
