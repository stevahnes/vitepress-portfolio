import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Stevanus Satria",
  description: "Stevanus Satria's Personal Website",
  themeConfig: {
    logo: "/small-logo-white-circle-bg.png",
    nav: [
      { text: "Home", link: "/" },
      { text: "About", link: "/about" },
    ],

    sidebar: [{ text: "About", items: [] }],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },

  vite: {
    plugins: [tailwindcss(), ViteImageOptimizer()],
  },
});
