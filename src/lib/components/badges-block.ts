// src/lib/components/badges-block.ts
import type DaggerheartPlugin from "../../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from "obsidian";
import yaml from "js-yaml";
import { processTemplate, createTemplateContext } from "../utils/template";

/**
 * YAML shape:
 * ```badges
 * items:
 *   - label: Race
 *     value: 'Half-Orc'
 *   - label: Level
 *     value: '{{ frontmatter.level }}'
 *   - label: Evasion
 *     value: '{{ frontmatter.evasion }}'
 *   - label: Armor
 *     value: '{{ frontmatter.armor }}'
 * ```
 */

type BadgeItem = {
  label?: string;
  value?: string | number | boolean | null;
};

type Doc = {
  items?: BadgeItem[];
};

function parseDoc(src: string): BadgeItem[] {
  try {
    const d = (yaml.load(src) as Doc) ?? {};
    if (Array.isArray(d.items)) return d.items;
    return [];
  } catch (e) {
    console.error("[DH-UI] badges YAML error:", e);
    return [];
  }
}

export function registerBadgesBlock(plugin: DaggerheartPlugin) {
  plugin.registerMarkdownCodeBlockProcessor(
    "badges",
    (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      el.empty();

      const items = parseDoc(src);
      if (!items.length) {
        el.createEl("pre", {
          text:
            "No 'items:' found in ```badges block.\nExample:\nitems:\n  - label: Level\n    value: '{{ frontmatter.level }}'",
        });
        return;
      }

      const app = plugin.app;
      const filePath = ctx.sourcePath || "unknown";
      const wrap = el.createEl("div", { cls: "dh-badges" });
      const valueSpans: HTMLSpanElement[] = [];

      // Initial template context
      let tctx = createTemplateContext(el, app, ctx);

      const renderValue = (raw: BadgeItem["value"]): string => {
        if (raw === null || raw === undefined) return "";
        if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
        if (typeof raw === "string") {
          try {
            return processTemplate(raw, tctx);
          } catch (e) {
            console.warn("[DH-UI] badge template error:", e);
            return raw;
          }
        }
        return "";
      };

      // Build static rows once
      for (const it of items) {
        const row = wrap.createEl("div", { cls: "dh-badge" });

        const lab = row.createEl("span", { cls: "dh-badge-label" });
        lab.setText((it?.label ?? "").toString());

        const val = row.createEl("span", { cls: "dh-badge-value" });
        val.setText(renderValue(it?.value));
        valueSpans.push(val);
      }

      // Recompute ONLY the values when frontmatter for THIS file changes
      const refreshValues = () => {
        tctx = createTemplateContext(el, app, ctx); // refresh context with latest cache
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          const span = valueSpans[i];
          span.setText(renderValue(it?.value));
        }
      };

      // Subscribe to Obsidian events (file-scoped)
      const offChanged = app.metadataCache.on("changed", (file: TFile) => {
        if (file && file.path === filePath) refreshValues();
      });

      const offResolved = app.metadataCache.on("resolved", () => {
        const active = app.workspace.getActiveFile();
        if (active && active.path === filePath) refreshValues();
      });

      const offOpen = app.workspace.on("file-open", (file) => {
        if (file && file.path === filePath) refreshValues();
      });

      // Clean up with a MarkdownRenderChild (ctx.addChild requires this)
      const child = new MarkdownRenderChild(el);
      child.onunload = () => {
        // @ts-ignore offref exists in Obsidian API
        app.metadataCache.offref(offChanged);
        // @ts-ignore offref exists in Obsidian API
        app.metadataCache.offref(offResolved);
        // @ts-ignore offref exists in Obsidian API
        app.workspace.offref(offOpen);
      };
      ctx.addChild(child);
    }
  );
}
