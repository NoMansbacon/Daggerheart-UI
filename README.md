# Daggerheart Tooltips (DH-UI)

An Obsidian plugin for **Daggerheart** that turns fenced code blocks into rich, live-updating character sheet UI.

Use simple Markdown + YAML to render traits, vitals, trackers, rest controls, damage calculators, badges, domain/equipment pickers, and more – all driven by your note frontmatter.

> **Warning**
> This plugin is under active development. Things may change or break between versions.

---

## 📖 Documentation

For complete documentation, examples, and guides, visit the docs site:

- 📚 **https://NoMansbacon.github.io/DH-UI/**

The docs include:

- **Quick Start / Usage Guide** – set up a character note and basic blocks in minutes.
- **Code Block Reference** – detailed options for every block (traits, vitals, rest, damage, consumables, badges, pickers, etc.).
- **Concepts & Guides** – state storage, template helpers, rest & level-up flow.
- **Examples** – full character note examples and recommended frontmatter.

---

## 🔧 Installation

### Via BRAT (recommended)

1. In Obsidian, install and enable **BRAT**.
2. In BRAT settings, add this repo as a beta plugin:
   `https://github.com/NoMansbacon/DH-UI`
3. Let BRAT install/update the plugin.
4. Enable **Daggerheart Tooltips (DH-UI)** in *Settings → Community plugins*.

### Manual (for developers)

1. Copy this folder into your vault under `.obsidian/plugins/daggerheart-tooltips`.
2. Run `npm install` in the plugin folder.
3. Run `npm run dev` to build `main.js`.
4. Enable **Daggerheart Tooltips** in *Settings → Community plugins*.

The plugin requires Obsidian `minAppVersion` as specified in `manifest.json`.

---

## 🧩 Development overview

This section is for developers who want to understand or extend the plugin.

### Code layout

- `src/main.ts` – plugin entry point; registers all blocks and settings.
- `src/blocks/` – one file per code block used in Markdown (e.g. `vitals.ts`, `rest.ts`, `damage-vault.ts`, `features.ts`, `consumables-block.ts`, `domain-picker.ts`, `equipment-picker.ts`, `experiences.ts`). Each file:
  - Parses the fenced code block YAML with `parseYamlSafe`.
  - Builds a template context with `createTemplateContext` when needed.
  - Renders either a React component (via `registerLiveCodeBlock`) or plain DOM.
- `src/components/` – React views used by the blocks (trackers, badges, consumables, rest controls, etc.).
- `src/utils/` – shared helpers (template engine, YAML parsing, events, React root management, live code block registration).
- `src/lib/services/` – state store and persistence helpers used across blocks.

### Key concepts

- **Template engine** (`src/utils/template.ts`)
  - Exposes `frontmatter.*`, `traits.*`, `skills.*`, and `character.*` into `{{ ... }}` templates.
  - Supports simple helpers like `add`, `subtract`, `multiply`, `divide`, `floor`, `ceil`, `round`, `modifier`.
- **State & events**
  - `src/lib/services/stateStore.ts` stores tracker values under keys like `tracker:<key>`.
  - `src/utils/events.ts` defines custom events such as `dh:tracker:changed`, `dh:kv:changed`, `dh:rest:short`, and `dh:rest:long`.
  - React components listen for these events (e.g. `TrackerRowView`, `KVProvider`) to stay in sync across blocks.
- **Dataview integrations**
  - `src/blocks/domain-picker.ts` and `src/blocks/equipment-picker.ts` query Dataview to discover cards/equipment based on folders, tags, and frontmatter.
  - They update character frontmatter lists (`vault` / `loadout`, `inventory` / `equipped`) via `app.fileManager.processFrontMatter`.

### Where to start reading

- For a simple example: start with `src/blocks/experiences.ts` (small, DOM‑only) or `src/blocks/consumables-block.ts` (YAML → React view).
- For vitals / rest / damage flow: read `src/blocks/vitals.ts`, then `src/blocks/rest.ts`, then `src/blocks/damage-vault.ts`.
- For advanced UI: inspect `src/blocks/domain-picker.ts` and `src/blocks/equipment-picker.ts`.

The docs in `docs/` mirror the block APIs closely, so you can usually read the corresponding Markdown page under `docs/blocks` or `docs/vitals and damage` and then jump into the matching file in `src/blocks`.

---

## Licensing & attribution

- This plugin is an unofficial fan work built for the Daggerheart roleplaying game.
- It is informed by and references the Daggerheart System Reference Document (SRD) published by Darrington Press.
- This project is not affiliated with, endorsed, or sponsored by Critical Role, Darrington Press, or their partners.
