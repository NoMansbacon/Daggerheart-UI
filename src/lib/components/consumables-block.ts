// src/lib/components/consumables-block.ts
import type DaggerheartPlugin from "../../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from "obsidian";
import yaml from "js-yaml";
import { processTemplate, createTemplateContext } from "../utils/template";

/**
 * Supported YAML shapes:
 *
 * A) List:
 * items:
 *   - label: "Health Potion"
 *     state_key: din_hp_pots
 *     uses: 3
 *   - label: "Rage"
 *     state_key: din_rage
 *     uses: "{{ frontmatter.rage_uses }}"
 *
 * B) Single item (no "items"):
 * label: "Health Potion"
 * state_key: din_hp_pots
 * uses: "{{ add 1 frontmatter.slots }}"
 *
 * C) Map under items:
 * items:
 *   hp:
 *     label: "Health Potion"
 *     state_key: din_hp_pots
 *     uses: 3
 */

type ConsumableItem = {
  label?: string;
  state_key?: string;
  uses?: number | string;
};

type DocLoose =
  | {
      items?: ConsumableItem[] | Record<string, ConsumableItem>;
      label?: string;
      state_key?: string;
      uses?: number | string;
    }
  | undefined
  | null;

function parseRootToItems(src: string): ConsumableItem[] {
  let raw: DocLoose;
  try {
    raw = (yaml.load(src) as DocLoose) ?? {};
  } catch (e) {
    console.error("[DH-UI] consumables YAML error:", e);
    return [];
  }

  // B) Single item at root
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray((raw as any).items) &&
    typeof (raw as any).items !== "object" &&
    ("label" in raw || "state_key" in raw || "uses" in raw)
  ) {
    return [
      {
        label: (raw as any).label ?? "Consumable",
        state_key: (raw as any).state_key ?? "",
        uses: (raw as any).uses ?? 0,
      },
    ];
  }

  // A/C) items exists
  const itemsAny = (raw as any)?.items;

  if (Array.isArray(itemsAny)) {
    return itemsAny.map((x) => ({
      label: x?.label ?? "Consumable",
      state_key: x?.state_key ?? "",
      uses: x?.uses ?? 0,
    }));
  }

  if (itemsAny && typeof itemsAny === "object") {
    return Object.values(itemsAny).map((x: any) => ({
      label: x?.label ?? "Consumable",
      state_key: x?.state_key ?? "",
      uses: x?.uses ?? 0,
    }));
  }

  return [];
}

function readState(key: string, maxUses: number): number {
  try {
    const raw = localStorage.getItem(`dh:consumable:${key}`);
    if (!raw) return 0;
    const n = Number(JSON.parse(raw));
    if (isNaN(n)) return 0;
    return Math.max(0, Math.min(maxUses, n));
  } catch {
    return 0;
  }
}

function writeState(key: string, filled: number) {
  try {
    localStorage.setItem(`dh:consumable:${key}`, JSON.stringify(filled));
  } catch {}
}

export function registerConsumablesBlock(plugin: DaggerheartPlugin) {
  plugin.registerMarkdownCodeBlockProcessor(
    "consumables",
    (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      el.empty();

      const app = plugin.app;
      const filePath = ctx.sourcePath || "unknown";

      // Build outer container
      const wrap = el.createEl("div", { cls: "dh-consumables" });

      // Keep per-row rebuilders so we can re-evaluate templates when frontmatter changes
      const rebuilders: Array<() => void> = [];

      // We recreate template context on each refresh so frontmatter/abilities helpers stay fresh
      const makeCtx = () => createTemplateContext(el, app, ctx);

      const items = parseRootToItems(src);
      if (!items.length) {
        el.createEl("pre", { text: "No 'items:' in ```consumables block." });
        return;
      }

      for (const it of items) {
        const label = (it?.label ?? "").toString() || "Consumable";
        const key = (it?.state_key ?? "").toString().trim();

        const row = wrap.createEl("div", { cls: "dh-consumable" });
        const head = row.createEl("div", { cls: "dh-consumable-head" });
        head.createSpan({ text: label });

        const boxes = row.createEl("div", { cls: "dh-consumable-uses" });

        const rebuild = () => {
          const tctx = makeCtx();

          // Resolve uses (supports templated string or number)
          let usesNum = 0;
          const rawUses = it?.uses ?? 0;
          if (typeof rawUses === "string") {
            const resolved = processTemplate(rawUses, tctx).trim();
            const n = Number(resolved);
            usesNum = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
          } else {
            const n = Number(rawUses);
            usesNum = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
          }

          boxes.empty();

          if (!key) {
            head.createSpan({ text: " (missing state_key)", cls: "dh-consumable-missing" });
            return;
          }
          if (usesNum <= 0) {
            head.createSpan({ text: " (uses: 0)", cls: "dh-consumable-missing" });
            return;
          }

          // Build exact number of boxes
          for (let i = 0; i < usesNum; i++) {
            boxes.createDiv({ cls: "dh-consume-box", attr: { "data-idx": String(i) } });
          }

          // Restore state (clamped)
          let filled = readState(key, usesNum);

          const paint = () => {
            if (filled > usesNum) filled = usesNum;
            for (let i = 0; i < boxes.children.length; i++) {
              const d = boxes.children[i] as HTMLDivElement;
              d.classList.toggle("on", i < filled);
            }
          };

          paint();

          // Click handler (re-bound on rebuild since we rebuild the DOM)
          boxes.onclick = (ev) => {
            const target = ev.target as HTMLElement;
            if (!target || !target.classList.contains("dh-consume-box")) return;
            const idx = Number(target.getAttr("data-idx") ?? -1);
            if (isNaN(idx) || idx < 0) return;

            const newFilled = idx + 1;
            if (newFilled === filled) filled = idx; // step down
            else filled = newFilled;

            writeState(key, filled);
            paint();
          };
        };

        rebuild();
        rebuilders.push(rebuild);
      }

      // Subscribe to frontmatter changes for THIS file and refresh in place
      const offChanged = plugin.app.metadataCache.on("changed", (file: TFile) => {
        if (file && file.path === filePath) {
          for (const r of rebuilders) r();
        }
      });

      const offResolved = plugin.app.metadataCache.on("resolved", () => {
        const active = plugin.app.workspace.getActiveFile();
        if (active && active.path === filePath) {
          for (const r of rebuilders) r();
        }
      });

      const offOpen = plugin.app.workspace.on("file-open", (file) => {
        if (file && file.path === filePath) {
          for (const r of rebuilders) r();
        }
      });

      // Proper cleanup
      const child = new MarkdownRenderChild(el);
      child.onunload = () => {
        // @ts-ignore offref exists
        plugin.app.metadataCache.offref(offChanged);
        // @ts-ignore offref exists
        plugin.app.metadataCache.offref(offResolved);
        // @ts-ignore offref exists
        plugin.app.workspace.offref(offOpen);
      };
      ctx.addChild(child);
    }
  );
}
