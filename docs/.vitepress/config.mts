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
              link: "https://github.com/stevahnes/vitepress-portfolio",
              target: "_blank",
            },
            {
              text: "Call Home",
              link: "https://github.com/bettersg/call-home",
              target: "_blank",
            },
            {
              text: "Portfolio (WordPress)",
              link: "/projects/portfolio-wordpress",
            },
            {
              text: "Figma Plugins",
              link: "https://www.figma.com/@stevahnes",
              target: "_blank",
            },
            {
              text: "BRÜ-ME",
              link: "https://youtu.be/ch4kpChdSHs",
              target: "_blank",
            },
            {
              text: "Lumos",
              link: "https://youtu.be/qXR_C5dezqM",
              target: "_blank",
            },
            {
              text: "RoverBot",
              link: "https://youtu.be/VbQ1-GKdCEk",
              target: "_blank",
            },
            {
              text: "ZOUBA",
              link: "https://youtu.be/oQVsBJ_NuM8",
              target: "_blank",
            },
            {
              text: "Mod-Bot",
              link: "https://youtu.be/DdzkIislYo0",
              target: "_blank",
            },
            {
              text: "SALAMANDER",
              link: "https://youtu.be/3CECXdaeLnI",
              target: "_blank",
            },
            {
              text: "Velox",
              link: "https://youtu.be/IPcm3R25azw",
              target: "_blank",
            },
            {
              text: "Troll Kart",
              link: "https://youtu.be/lIg7apmuWjo",
              target: "_blank",
            },
            {
              text: "Quadwalker",
              link: "https://youtu.be/xLcHc-iailM",
              target: "_blank",
            },
          ],
        },
      ],
      "/milestones": [
        {
          text: "Milestones",
          link: "/milestones",
          items: [
            {
              text: "2025",
              link: "/milestones#2025",
            },
            {
              text: "2024",
              link: "/milestones#2024",
            },
            {
              text: "2022",
              link: "/milestones#2022",
            },
            {
              text: "2021",
              link: "/milestones#2021",
            },
            {
              text: "2020",
              link: "/milestones#2020",
            },
            {
              text: "2017",
              link: "/milestones#2017",
            },
            {
              text: "2016",
              link: "/milestones#2016",
            },
            {
              text: "2015",
              link: "/milestones#2015",
            },
            {
              text: "2014",
              link: "/milestones#2014",
            },
            {
              text: "2013",
              link: "/milestones#2013",
            },
            {
              text: "2008",
              link: "/milestones#2008",
            },
          ],
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
