// src/lib/components/trackers-block.ts
import type DaggerheartPlugin from "../../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from "obsidian";
import yaml from "js-yaml";
import { processTemplate, createTemplateContext } from "../utils/template";

/**
 * Trackers: hp | stress | armor | hope
 * - Accept either type-specific key or generic `uses:`
 * - Values support templates, e.g. "{{ frontmatter.hp }}"
 * - Hope defaults to 6 if not specified
 * - Rectangles for hp/stress/armor, diamonds for hope (via CSS classes below)
 */

type TrackerYaml = {
  state_key?: string;
  label?: string;
  uses?: number | string;
  hp?: number | string;
  stress?: number | string;
  armor?: number | string;
  hope?: number | string;
};

function parseYaml(src: string): TrackerYaml {
  try {
    return (yaml.load(src) as TrackerYaml) ?? {};
  } catch (e) {
    console.error("[DH-UI] tracker YAML error:", e);
    return {};
  }
}

function resolveCount(
  raw: number | string | undefined,
  el: HTMLElement,
  app: any,
  ctx: MarkdownPostProcessorContext
): number {
  if (raw == null) return 0;
  if (typeof raw === "number") {
    const n = Math.floor(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }
  try {
    const tctx = createTemplateContext(el, app, ctx);
    const out = processTemplate(String(raw), tctx).trim();
    const n = Math.floor(Number(out));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}

function readState(key: string, max: number): number {
  try {
    const raw = localStorage.getItem(`dh:tracker:${key}`);
    if (!raw) return 0;
    const n = Number(JSON.parse(raw));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(max, n));
  } catch {
    return 0;
  }
}

function writeState(key: string, v: number) {
  try {
    localStorage.setItem(`dh:tracker:${key}`, JSON.stringify(v));
  } catch {}
}

/** Registers one tracker code block (hp | stress | armor | hope). */
function registerOneTracker(
  plugin: DaggerheartPlugin,
  blockName: "hp" | "stress" | "armor" | "hope",
  extraBoxCls: string
) {
  plugin.registerMarkdownCodeBlockProcessor(
    blockName,
    (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      el.empty();

      const app = plugin.app;
      const filePath = ctx.sourcePath || "unknown";

      const wrap = el.createEl("div", { cls: "dh-tracker" });
      const head = wrap.createEl("div", { cls: "dh-tracker-head" });
      // IMPORTANT: class names determine shape and color
      const boxes = wrap.createEl("div", { cls: `dh-tracker-boxes ${extraBoxCls}` });

      const rebuild = () => {
        const y = parseYaml(src);

        const labelText = (y.label || blockName.toUpperCase()).toString();
        const stateKey = (y.state_key || "").toString().trim();

        let rawCount: number | string | undefined =
          y.uses !== undefined
            ? y.uses
            : blockName === "hp"
            ? y.hp
            : blockName === "stress"
            ? y.stress
            : blockName === "armor"
            ? y.armor
            : y.hope;

        if (blockName === "hope" && (rawCount === undefined || String(rawCount).trim() === "")) {
          rawCount = 6;
        }

        const count = resolveCount(rawCount, el, app, ctx);

        head.empty();
        head.createSpan({ text: labelText });

        boxes.empty();

        if (!stateKey) {
          head.createSpan({ text: " (missing state_key)", cls: "dh-tracker-missing" });
          return;
        }
        if (count <= 0) {
          head.createSpan({ text: " (0)", cls: "dh-tracker-missing" });
          return;
        }

        let filled = readState(stateKey, count);

        for (let i = 0; i < count; i++) {
          boxes.createDiv({ cls: "dh-track-box", attr: { "data-idx": String(i) } });
        }

        const paint = () => {
          if (filled > count) filled = count;
          const children = boxes.children;
          for (let i = 0; i < children.length; i++) {
            const d = children[i] as HTMLDivElement;
            d.classList.toggle("on", i < filled);
          }
        };
        paint();

        boxes.onclick = (ev) => {
          const t = ev.target as HTMLElement;
          if (!t || !t.classList.contains("dh-track-box")) return;
          const idx = Number(t.getAttr("data-idx") ?? -1);
          if (!Number.isFinite(idx) || idx < 0) return;

          const next = idx + 1;
          filled = next === filled ? idx : next;
          writeState(stateKey, filled);
          paint();
        };
      };

      rebuild();

      // Auto-refresh when frontmatter of this file changes
      const offChanged = plugin.app.metadataCache.on("changed", (file: TFile) => {
        if (file && file.path === filePath) rebuild();
      });
      const offResolved = plugin.app.metadataCache.on("resolved", () => {
        const active = plugin.app.workspace.getActiveFile();
        if (active && active.path === filePath) rebuild();
      });
      const offOpen = plugin.app.workspace.on("file-open", (file) => {
        if (file && file.path === filePath) rebuild();
      });

      const child = new MarkdownRenderChild(el);
      child.onunload = () => {
        // @ts-ignore Obsidian offref
        plugin.app.metadataCache.offref(offChanged);
        // @ts-ignore
        plugin.app.metadataCache.offref(offResolved);
        // @ts-ignore
        plugin.app.workspace.offref(offOpen);
      };
      ctx.addChild(child);
    }
  );
}

export function registerTrackersBlocks(plugin: DaggerheartPlugin) {
  // FORCE rectangles for HP / Stress / Armor by class
  registerOneTracker(plugin, "hp",     "dh-track-rect dh-track-hp");
  registerOneTracker(plugin, "stress", "dh-track-rect dh-track-stress");
  registerOneTracker(plugin, "armor",  "dh-track-rect dh-track-armor");
  // Diamonds for Hope
  registerOneTracker(plugin, "hope",   "dh-track-diamond dh-track-hope");
}
