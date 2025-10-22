// src/lib/views/abilityscoreview.tsx
import React from "react";
import { createRoot, Root } from "react-dom/client";
import type { App, MarkdownPostProcessorContext } from "obsidian";

import { AbilityView } from "../components/ability-cards";
import { buildCards } from "../domains/abilities";

/**
 * Renders the Daggerheart traits/abilities:
 * - Fixed six stats (Agility, Strength, Finesse, Instinct, Presence, Knowledge)
 * - Only shows TOTAL (base + trait)
 * - Per-card gold toggle (persisted via localStorage)
 */
export class AbilityScoreView {
  private app: App;
  private roots = new WeakMap<HTMLElement, Root>();

  constructor(app: App) {
    this.app = app;
  }

  public render(src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    const filePath = ctx.sourcePath || "unknown";
    const cards = buildCards(filePath, src);

    // Mount React into this codeblock’s container
    let root = this.roots.get(el);
    if (!root) {
      root = createRoot(el);
      this.roots.set(el, root);
    }
    root.render(<AbilityView data={cards} />);
  }
}
