// src/lib/components/short-rest.ts
import type DaggerheartPlugin from "../../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, Notice, TFile } from "obsidian";
import yaml from "js-yaml";

// ===== Helpers ===============================================================

function asNum(v: unknown, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function rollD4(): number {
  return 1 + Math.floor(Math.random() * 4);
}
function btn(label: string, cls = "dh-rest-btn"): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = cls;
  b.textContent = label;
  return b;
}
function pill(text: string, cls = "dh-rest-pill"): HTMLSpanElement {
  const s = document.createElement("span");
  s.className = cls;
  s.textContent = text;
  return s;
}

// localStorage state for trackers
function readFilled(key: string): number {
  try {
    const raw = localStorage.getItem(`dh:tracker:${key}`);
    return asNum(raw ? JSON.parse(raw) : 0, 0);
  } catch {
    return 0;
  }
}
function writeFilled(key: string, v: number) {
  try {
    localStorage.setItem(`dh:tracker:${key}`, JSON.stringify(v));
  } catch {}
}

// Find the preview container for this rendered block
function getPreviewScope(el: HTMLElement): HTMLElement {
  return (el.closest(".markdown-preview-view") as HTMLElement) ?? document.body;
}

// Find the first tracker boxes node for a given type within the same preview
function queryBoxesInScope(scope: HTMLElement, typeCls: string): HTMLElement | null {
  return scope.querySelector(`.dh-tracker-boxes.${typeCls}`) as HTMLElement | null;
}

// Count how many boxes exist for that tracker in DOM (for clamping)
function maxBoxesOf(container: HTMLElement | null): number {
  if (!container) return 0;
  return container.querySelectorAll(".dh-track-box").length;
}

// Repaint helper: apply "on" to first N boxes
function paintBoxes(container: HTMLElement | null, filled: number) {
  if (!container) return;
  const nodes = container.querySelectorAll(".dh-track-box");
  nodes.forEach((n, i) => (n as HTMLDivElement).classList.toggle("on", i < filled));
}

// ===== YAML ==================================================================

type ShortRestYaml = {
  // (we ignore tier in YAML; tier comes from frontmatter each time modal opens)
  label?: string;             // trigger button label

  // state keys for trackers (defaults provided)
  hp_key?: string;
  stress_key?: string;
  armor_key?: string;
  hope_key?: string;
};

function parseYaml(src: string): ShortRestYaml {
  try {
    return (yaml.load(src) as ShortRestYaml) ?? {};
  } catch {
    return {};
  }
}

// ===== Registration ==========================================================

export function registerShortRest(plugin: DaggerheartPlugin) {
  plugin.registerMarkdownCodeBlockProcessor(
    "short-rest",
    async (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      el.empty();

      const file = plugin.app.vault.getAbstractFileByPath(ctx.sourcePath);
      if (!(file instanceof TFile)) {
        el.createEl("pre", { text: "Short Rest: could not resolve file." });
        return;
      }

      const conf = parseYaml(src);
      const triggerLabel = String(conf.label ?? "Short Rest");

      // State keys (must match your trackers' `state_key:`)
      const hpKey = String(conf.hp_key ?? "din_health");
      const stressKey = String(conf.stress_key ?? "din_stress");
      const armorKey = String(conf.armor_key ?? "din_armor");
      const hopeKey = String(conf.hope_key ?? "din_hope");

      // Render a single trigger button
      const trigger = el.createEl("button", { cls: "dh-rest-trigger" });
      trigger.setText(triggerLabel);

      trigger.onclick = () => {
        // Always read fresh TIER from FRONTMATTER at open time
        const mdNow = plugin.app.metadataCache.getFileCache(file);
        const fmNow = mdNow?.frontmatter ?? {};
        const tier = asNum(fmNow.tier ?? 0, 0); // <- source of truth

        // Modal shell
        const modal = document.createElement("div");
        modal.className = "dh-rest-modal";
        const backdrop = document.createElement("div");
        backdrop.className = "dh-rest-backdrop";
        modal.appendChild(backdrop);

        // Panel
        const panel = document.createElement("div");
        panel.className = "dh-rest-chooser";
        modal.appendChild(panel);

        // Header
        const head = panel.createDiv({ cls: "dh-rest-headerbar" });
        const titleWrap = head.createDiv({ cls: "dh-rest-titlewrap" });
        titleWrap.createDiv({ cls: "dh-rest-title", text: "Short Rest" });
        titleWrap.createDiv({
          cls: "dh-rest-sub",
          text: "Choose exactly two moves (you may choose the same move twice). 1d4 + Tier."
        });

        const party = head.createDiv({ cls: "dh-rest-party" });
        party.append(pill(`Tier ${tier}`));

        const picks = head.createDiv({ cls: "dh-rest-picks" });
        picks.setText("Selected: 0/2");

        const closeBtn = head.createEl("button", { cls: "dh-rest-close", text: "×" });
        closeBtn.setAttr("aria-label", "Close");

        // Choices
        const actions = panel.createDiv({ cls: "dh-rest-actions" });
        const CHOICES = [
          { key: "wounds", label: "Tend to Wounds (Heal HP)" },
          { key: "stress", label: "Clear Stress" },
          { key: "armor", label: "Repair Armor" },
          { key: "prepare", label: "Prepare (+1 Hope)" },
          { key: "prepare_party", label: "Prepare with Party (+2 Hope)" }
        ] as const;

        // Selection counts per key (0..2). Total picks must be exactly 2.
        const counts: Record<string, number> = Object.fromEntries(CHOICES.map(c => [c.key, 0]));

        const totalSelected = () => Object.values(counts).reduce((a, b) => a + b, 0);
        const refreshCount = () => (picks.textContent = `Selected: ${totalSelected()}/2`);

        const choiceBtns: Record<string, HTMLButtonElement> = {};

        const labelWithCount = (label: string, count: number) =>
          count === 0 ? label : `${label} ×${count}`;

        for (const c of CHOICES) {
          const b = btn(c.label);
          choiceBtns[c.key] = b;

          const updateButton = () => {
            const ct = counts[c.key];
            b.textContent = labelWithCount(c.label, ct);
            b.classList.toggle("on", ct > 0);
          };
          updateButton();

          b.onclick = () => {
            // Mutual exclusion: prepare vs prepare_party
            if (c.key === "prepare" && counts["prepare_party"] > 0) {
              counts["prepare_party"] = 0;
              const lbl = CHOICES.find(x => x.key === "prepare_party")!.label;
              choiceBtns["prepare_party"].textContent = lbl;
              choiceBtns["prepare_party"].classList.remove("on");
            }
            if (c.key === "prepare_party" && counts["prepare"] > 0) {
              counts["prepare"] = 0;
              const lbl = CHOICES.find(x => x.key === "prepare")!.label;
              choiceBtns["prepare"].textContent = lbl;
              choiceBtns["prepare"].classList.remove("on");
            }

            // Cycle this button's count: 0 → 1 → 2 → 0, but forbid exceeding total 2
            const cur = counts[c.key];
            const next = (cur + 1) % 3;
            const delta = next - cur;

            if (delta > 0 && totalSelected() + delta > 2) {
              new Notice("Select exactly two total moves.");
              return;
            }

            counts[c.key] = next;
            updateButton();
            refreshCount();
          };

          actions.appendChild(b);
        }
        refreshCount();

        // Apply row
        const applyRow = panel.createDiv({ cls: "dh-rest-apply" });
        const applyBtn = btn("Apply Short Rest", "dh-event-btn");
        applyRow.appendChild(applyBtn);

        // Scope to this note's preview so we can find matching trackers to repaint
        const scope = getPreviewScope(el);

        const closeModal = () => {
          if (modal.parentElement) document.body.removeChild(modal);
          window.removeEventListener("keydown", onKey);
        };
        const onKey = (ev: KeyboardEvent) => {
          if (ev.key === "Escape") closeModal();
        };
        backdrop.onclick = closeModal;
        closeBtn.onclick = closeModal;
        window.addEventListener("keydown", onKey);

        applyBtn.onclick = () => {
          const picksTotal = totalSelected();
          if (picksTotal !== 2) {
            new Notice("Select exactly two moves.");
            return;
          }

          // Read current filled values
          let hpFilled = readFilled(hpKey);
          let stressFilled = readFilled(stressKey);
          let armorFilled = readFilled(armorKey);
          let hopeFilled = readFilled(hopeKey);

          // Get visible box counts to clamp properly
          const hpBoxesEl    = queryBoxesInScope(scope,   "dh-track-hp");
          const stressBoxesEl= queryBoxesInScope(scope,   "dh-track-stress");
          const armorBoxesEl = queryBoxesInScope(scope,   "dh-track-armor");
          const hopeBoxesEl  = queryBoxesInScope(scope,   "dh-track-hope");

          const hpMax    = maxBoxesOf(hpBoxesEl);
          const stressMax= maxBoxesOf(stressBoxesEl);
          const armorMax = maxBoxesOf(armorBoxesEl);
          const hopeMax  = maxBoxesOf(hopeBoxesEl);

          const toastLines: string[] = [];
          const doRoll = (label: string) => {
            const d4 = rollD4();
            const total = d4 + tier;
            toastLines.push(`${label}: 1d4(${d4}) + Tier(${tier}) = ${total}`);
            return total;
          };

          // Apply each move as many times as selected (two total)
          for (let i = 0; i < counts["wounds"]; i++) {
            const amt = doRoll("Tend to Wounds (HP)");
            hpFilled = Math.max(0, hpFilled - amt);
          }
          for (let i = 0; i < counts["stress"]; i++) {
            const amt = doRoll("Clear Stress");
            stressFilled = Math.max(0, stressFilled - amt);
          }
          for (let i = 0; i < counts["armor"]; i++) {
            const amt = doRoll("Repair Armor");
            armorFilled = Math.max(0, armorFilled - amt);
          }
          for (let i = 0; i < counts["prepare"]; i++) {
            toastLines.push("Prepare: +1 Hope");
            hopeFilled = hopeFilled + 1;
            if (hopeMax > 0) hopeFilled = Math.min(hopeFilled, hopeMax);
          }
          for (let i = 0; i < counts["prepare_party"]; i++) {
            toastLines.push("Prepare with Party: +2 Hope");
            hopeFilled = hopeFilled + 2;
            if (hopeMax > 0) hopeFilled = Math.min(hopeFilled, hopeMax);
          }

          // Clamp to visible limits if present
          if (hpMax) hpFilled = Math.max(0, Math.min(hpMax, hpFilled));
          if (stressMax) stressFilled = Math.max(0, Math.min(stressMax, stressFilled));
          if (armorMax) armorFilled = Math.max(0, Math.min(armorMax, armorFilled));
          if (hopeMax) hopeFilled = Math.max(0, Math.min(hopeMax, hopeFilled));

          // Persist new filled values
          writeFilled(hpKey, hpFilled);
          writeFilled(stressKey, stressFilled);
          writeFilled(armorKey, armorFilled);
          writeFilled(hopeKey, hopeFilled);

          // Repaint current view immediately
          paintBoxes(hpBoxesEl, hpFilled);
          paintBoxes(stressBoxesEl, stressFilled);
          paintBoxes(armorBoxesEl, armorFilled);
          paintBoxes(hopeBoxesEl, hopeFilled);

          // Toast math + summary; then close modal
          const summary = `Now: HP ${hpFilled} • Stress ${stressFilled} • Armor ${armorFilled} • Hope ${hopeFilled}`;
          const toast = (toastLines.length ? toastLines.join(" • ") + " — " : "") + summary;
          new Notice(toast, 7000);

          closeModal();
        };

        document.body.appendChild(modal);
        setTimeout(() => actions.querySelector("button")?.focus(), 0);
      };

      // Cleanup container child
      const child = new MarkdownRenderChild(el);
      ctx.addChild(child);
    }
  );
}
