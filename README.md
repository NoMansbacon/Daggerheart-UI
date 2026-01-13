# Daggerheart Tooltips (DH-UI)

Daggerheart Tooltips is an Obsidian plugin that turns fenced code blocks into rich, live-updating UI for Daggerheart campaigns.

It renders traits, vitals, trackers, rest controls, damage calculators, badges, and more – all driven by simple YAML and your note frontmatter.

---

## Installation

### Recommended: via BRAT (Beta Reviewers Auto-update Tester)

1. In Obsidian, install and enable **BRAT**.
2. In BRAT settings, add this repository URL as a beta plugin:
   `https://github.com/NoMansbacon/DH-UI`
3. Let BRAT install/update the plugin.
4. In Obsidian, enable **Daggerheart Tooltips (DH-UI)** in *Settings → Community plugins*.

### Manual install (developers / advanced users)

1. Copy this folder into your vault under `.obsidian/plugins/daggerheart-tooltips` (or use your preferred Obsidian plugin workflow).
2. Run `npm install` in the plugin folder.
3. Run `npm run dev` to build `main.js` from the TypeScript sources.
4. In Obsidian, enable **Daggerheart Tooltips** in *Settings → Community plugins*.

The plugin requires Obsidian `minAppVersion` as specified in `manifest.json`.

---

## Documentation

The full docs, examples, and code block reference are hosted on GitHub Pages:

- **Docs site:** https://NoMansbacon.github.io/DH-UI/

Start with **Get Started** / **Usage Guide** on the docs site for character frontmatter, example blocks, and detailed behavior.
