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
        text: "Reference",
        items: [
          { text: "Code Blocks", link: "/blocks" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/NoMansbacon/DH-UI" },
    ],
  },
});
