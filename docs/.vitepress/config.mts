import { defineConfig } from "vitepress";
import tailwindcss from "@tailwindcss/vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Stevanus Satria",
  description: "Stevanus Satria's Personal Website",
  head: [
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/small-logo-white-circle-bg.png",
      },
    ],
    [
      "link",
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/small-logo-white-circle-bg.png",
      },
    ],
  ],
  themeConfig: {
    logo: "/small-logo-no-bg.png",
    nav: [
      { text: "Home", link: "/" },
      { text: "Projects", link: "/projects" },
      { text: "Milestones", link: "/milestones" },
      { text: "Recommendations", link: "/recommendations" },
      { text: "Stack", link: "/stack" },
      { text: "Gear", link: "/gear" },
    ],

    sidebar: {
      "/projects/": [
        {
          text: "Projects",
          link: "/projects",
          items: [
            {
              text: "Portfolio (VitePress)",
              link: "/projects/portfolio-vitepress",
            },
            {
              text: "Portfolio (WordPress)",
              link: "/projects/portfolio-wordpress",
            },
            {
              text: "Figma Plugins",
              link: "/projects/figma-plugins",
            },
            {
              text: "BRÜ-ME",
              link: "/projects/brume",
            },
            {
              text: "Lumos",
              link: "/projects/lumos",
            },
            {
              text: "RoverBot",
              link: "/projects/roverbot",
            },
            {
              text: "ZOUBA",
              link: "/projects/zouba",
            },
            {
              text: "Mod-Bot",
              link: "/projects/mod-bot",
            },
            {
              text: "SALAMANDER",
              link: "/projects/salamander",
            },
            {
              text: "Velox",
              link: "/projects/velox",
            },
            {
              text: "Troll Kart",
              link: "/projects/troll-kart",
            },
            {
              text: "Quadwalker",
              link: "/projects/quadwalker",
            },
          ],
        },
      ],
      "/milestones": [
        {
          text: "Milestones",
          link: "/milestones",
          items: [],
        },
      ],
      "/recommendations": [
        {
          text: "Recommendations",
          link: "/recommendations",
          items: [
            {
              text: "Workato",
              link: "/recommendations#workato",
              items: [
                { text: "Chisin Ng", link: "/recommendations#chisin-ng" },
                {
                  text: "Swathi Asokraj",
                  link: "/recommendations#swathi-asokraj",
                },
              ],
            },
            {
              text: "Shopee",
              link: "/recommendations#shopee",
              items: [
                {
                  text: "Siyu (Henry) Tang",
                  link: "/recommendations#siyu-henry-tang",
                },
                {
                  text: "Joanne Tan",
                  link: "/recommendations#joanne-tan",
                },
                {
                  text: "Xiang Rong Ong",
                  link: "/recommendations#xiang-rong-ong",
                },
                {
                  text: "Laurinda Wu",
                  link: "/recommendations#laurinda-wu",
                },
                {
                  text: "Rachel Esther Chan",
                  link: "/recommendations#rachel-esther-chan",
                },
              ],
            },
            {
              text: "Amadeus",
              link: "/recommendations#amadeus",
              items: [
                {
                  text: "Gus Salamoun",
                  link: "/recommendations#gus-salamoun",
                },
                {
                  text: "Stephanie Tan",
                  link: "/recommendations#stephanie-tan",
                },
                {
                  text: "Jyolsna Elangovan",
                  link: "/recommendations#jyolsna-elangovan",
                },
                {
                  text: "Gwendolin Tan",
                  link: "/recommendations#gwendolin-tan",
                },
                {
                  text: "Jameel Shaik",
                  link: "/recommendations#jameel-shaik",
                },
                {
                  text: "Zeyao Liu",
                  link: "/recommendations#zeyao-liu",
                },
                {
                  text: "Satyaranjan Muduli",
                  link: "/recommendations#satyaranjan-muduli",
                },
                {
                  text: "Gopinath Gunanithi",
                  link: "/recommendations#gopinath-gunanithi",
                },
                {
                  text: "Thejashree Chandraiah",
                  link: "/recommendations#thejashree-chandraiah",
                },
                {
                  text: "Colin McKell-Redwood",
                  link: "/recommendations#colin-mckell-redwood",
                },
              ],
            },
            {
              text: "Works Applications",
              link: "/recommendations#works-applications",
              items: [{ text: "Ray Pan", link: "/recommendations#ray-pan" }],
            },
            {
              text: "SUTD",
              link: "/recommendations#sutd",
              items: [
                { text: "Harry Nguyen", link: "/recommendations#harry-nguyen" },
              ],
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "linkedin", link: "https://www.linkedin.com/in/stevanussatria" },
      { icon: "github", link: "https://github.com/stevahnes" },
      {
        icon: "researchgate",
        link: "https://www.researchgate.net/profile/Stevanus-Satria",
      },
      { icon: "strava", link: "https://www.strava.com/athletes/18347400" },
      { icon: "soundcloud", link: "https://soundcloud.com/stevanus-satria" },
    ],

    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} Stevanus Satria | Powered by VitePress`,
    },
  },

  vite: {
    plugins: [tailwindcss(), ViteImageOptimizer()],
  },
});
