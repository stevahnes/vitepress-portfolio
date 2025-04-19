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
      { text: "Contact", link: "mailto:me@stevanussatria.com" },
    ],

    sidebar: [{ text: "Home", items: [] }],

    socialLinks: [
      { icon: "linkedin", link: "https://www.linkedin.com/in/stevanussatria" },
      { icon: "github", link: "https://github.com/stevahnes" },
      { icon: "soundcloud", link: "https://soundcloud.com/stevanus-satria" },
      {
        icon: "researchgate",
        link: "https://www.researchgate.net/profile/Stevanus-Satria",
      },
      { icon: "strava", link: "https://www.strava.com/athletes/18347400" },
    ],
  },

  vite: {
    plugins: [tailwindcss(), ViteImageOptimizer()],
  },
});
