import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Daggerheart Tooltips (DH-UI)",
  description: "Build rich Daggerheart character sheets in Obsidian using live UI blocks.",
  base: "/DH-UI/",
  themeConfig: {
    search: {
      provider: "local",
    },
    nav: [
      { text: "Home", link: "/" },
      { text: "Docs", link: "/USAGE" },
    ],
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Usage Guide", link: "/USAGE" },
        ],
      },
      {
        text: "Code Blocks",
        items: [
          { text: "Overview", link: "/blocks" },
          { text: "Traits & Abilities", link: "/blocks/traits-abilities" },
          { text: "Vitals & Trackers", link: "/blocks/vitals-trackers" },
          { text: "Rest & Level Up", link: "/blocks/rest-levelup" },
          { text: "Damage", link: "/blocks/damage" },
          { text: "Consumables", link: "/blocks/consumables" },
          { text: "Badges & Features", link: "/blocks/badges-features" },
          { text: "Experiences", link: "/blocks/experiences" },
          { text: "Domain & Equipment Pickers", link: "/blocks/pickers" },
          { text: "Templates & Events", link: "/blocks/templates-events" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/NoMansbacon/DH-UI" },
    ],
  },
});
