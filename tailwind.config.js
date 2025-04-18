/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./docs/.vuepress/**/*.{vue,js,ts,md}",
    "./docs/**/*.{vue,js,ts,md}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0d0d",
        accent: "#8affc1",
        muted: "#999999",
      },
    },
  },
  plugins: [],
};
