// src/main.ts
import { Plugin, Notice, App, MarkdownPostProcessorContext } from "obsidian";

// React ability/traits renderer
import { AbilityScoreView } from "./lib/views/abilityscoreview";

// Other blocks
import { registerBadgesBlock } from "./lib/components/badges-block";
import { registerConsumablesBlock } from "./lib/components/consumables-block";
import { registerTrackersBlocks } from "./lib/components/trackers-block";
import { registerShortRest } from "./lib/components/short-rest";
import { registerLongRest } from "./lib/components/long-rest";
import { registerDamage } from "./lib/components/damage";
import { registerDashboard } from "./lib/components/dashboard"; // <-- NEW

export default class DaggerheartPlugin extends Plugin {
  async onload() {
    console.log("[DH-UI] loaded");

    // Ability / Traits (React)
    const renderAbilities = (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      try {
        const view = new AbilityScoreView(this.app as App);
        el.empty();
        view.render(src, el, ctx);
      } catch (e) {
        console.error("[DH-UI] AbilityScoreView render error:", e);
        const pre = el.createEl("pre");
        pre.setText("Error rendering abilities/traits block. See console for details.");
      }
    };
    this.registerMarkdownCodeBlockProcessor("ability", renderAbilities);
    this.registerMarkdownCodeBlockProcessor("traits", renderAbilities);

    // Other processors
    try { registerBadgesBlock(this); }       catch (e) { console.error("[DH-UI] badges load error", e); }
    try { registerConsumablesBlock(this); }  catch (e) { console.error("[DH-UI] consumables load error", e); }
    try { registerTrackersBlocks(this); }    catch (e) { console.error("[DH-UI] trackers load error", e); }
    try { registerShortRest(this); }         catch (e) { console.error("[DH-UI] short-rest load error", e); }
    try { registerLongRest(this); }          catch (e) { console.error("[DH-UI] long-rest load error", e); }
    try { registerDamage(this); }            catch (e) { console.error("[DH-UI] damage load error", e); }

    // NEW: unified dashboard block
    try { registerDashboard(this); }         catch (e) { console.error("[DH-UI] dashboard load error", e); }

    // Optional: quick reload command
    this.addCommand({
      id: "dh-reload",
      name: "Reload Daggerheart UI",
      callback: async () => {
        try {
          const id = this.manifest.id;
          // @ts-ignore private API
          await this.app.plugins.disablePlugin(id);
          // @ts-ignore private API
          await this.app.plugins.enablePlugin(id);
          new Notice("Daggerheart UI reloaded.");
        } catch (e) {
          console.error("[DH-UI] reload failed", e);
          new Notice("Reload failed (check console).");
        }
      },
    });
  }

  onunload() {
    console.log("[DH-UI] unloaded");
  }
}
