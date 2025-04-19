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
      { text: "Projects", link: "/projects" },
      { text: "Milestones", link: "/milestones" },
      { text: "Recommendations", link: "/recommendations" },
      { text: "Stack", link: "/stack" },
      { text: "Gear", link: "/gear" },
    ],

    sidebar: {
      "/projects": [
        {
          text: "Projects",
          link: "/projects",
          items: [
            { text: "One", link: "/projects/one" },
            { text: "Two", link: "/projects/two" },
          ],
        },
      ],
      "/milestones": [
        {
          text: "Milestones",
          link: "/milestones",
          items: [
            { text: "2025", link: "/milestones#2025" },
            { text: "2024", link: "/milestones#2024" },
            { text: "2023", link: "/milestones#2023" },
          ],
        },
      ],
      "/recommendations": [
        {
          text: "Recommendations",
          link: "/recommendations",
          items: [
            { text: "Workato", link: "/recommendations#workato" },
            { text: "Shopee", link: "/recommendations#shopee" },
            { text: "Amadeus", link: "/recommendations#amadeus" },
          ],
        },
      ],
    },

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
