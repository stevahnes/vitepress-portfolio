import type { Config } from "tailwindcss";

export default {
  content: [
    "./docs/.vuepress/**/*.{vue,js,ts,md}",
    "./docs/**/*.{vue,js,ts,md}",
  ],
  theme: {},
  plugins: [],
} satisfies Config;
