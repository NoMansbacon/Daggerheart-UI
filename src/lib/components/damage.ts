// src/lib/components/damage.ts
import type DaggerheartPlugin from "../../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, Notice, TFile } from "obsidian";
import yaml from "js-yaml";

/** ---------- Small helpers ---------- */
function asNum(v: unknown, def = 0): number {
  if (v === null || v === undefined) return def;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : def;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
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
function getPreviewScope(el: HTMLElement): HTMLElement {
  return (el.closest(".markdown-preview-view") as HTMLElement) ?? document.body;
}
function queryBoxesInScope(scope: HTMLElement, typeCls: string): HTMLElement | null {
  return scope.querySelector(`.dh-tracker-boxes.${typeCls}`) as HTMLElement | null;
}
function maxBoxesOf(container: HTMLElement | null): number {
  if (!container) return 0;
  return container.querySelectorAll(".dh-track-box").length;
}
function paintBoxes(container: HTMLElement | null, filled: number) {
  if (!container) return;
  const nodes = container.querySelectorAll(".dh-track-box");
  nodes.forEach((n, i) => (n as HTMLDivElement).classList.toggle("on", i < filled));
}
function readFmNumber(fm: Record<string, any>, aliases: string[], def = NaN): number {
  for (const k of aliases) {
    if (fm[k] !== undefined) return asNum(fm[k], def);
  }
  return def;
}
function tierName(tier: number): "None" | "Minor" | "Major" | "Severe" {
  return tier <= 0 ? "None" : tier === 1 ? "Minor" : tier === 2 ? "Major" : "Severe";
}

/** ---------- YAML input ---------- */
type DamageYaml = {
  title?: string;
  hp_key?: string; // default "din_health"

  // Final thresholds (used as-is; no level added)
  major_threshold?: number | string;
  severe_threshold?: number | string;

  // Base thresholds (only used if final thresholds not found)
  base_major?: number | string;
  base_severe?: number | string;

  // Level/Tier (only for base-mode fallback)
  level?: number | string;
};

function parseYaml(src: string): DamageYaml {
  try {
    return (yaml.load(src) as DamageYaml) ?? {};
  } catch {
    return {};
  }
}

/** ---------- Registration ---------- */
export function registerDamage(plugin: DaggerheartPlugin) {
  plugin.registerMarkdownCodeBlockProcessor(
    "damage",
    async (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      el.empty();

      // Use TFile for metadata lookups
      const file = plugin.app.vault.getFileByPath(ctx.sourcePath);
      if (!file) {
        el.createEl("pre", { text: "Damage: could not resolve file." });
        return;
      }

      const conf = parseYaml(src);
      const hpKey = String(conf.hp_key ?? "din_health");

      // UI
      const wrap = el.createDiv({ cls: "dh-damage-inline" });
      wrap.createEl("div", { cls: "dh-rest-title", text: conf.title ?? "Damage" });
      const sub = wrap.createEl("div", { cls: "dh-rest-sub", text: "" });

      const row = wrap.createDiv({ cls: "dh-dmg-row" });

      const mkLabel = (t: string) => {
        const l = document.createElement("label");
        l.className = "dh-dmg-label";
        l.textContent = t;
        return l;
      };

      const dmgInput = document.createElement("input");
      dmgInput.type = "number";
      dmgInput.min = "0";
      dmgInput.value = "0";
      dmgInput.className = "dh-dmg-input";

      // NEW MEANING: "Reduce by" lowers the severity tier (each point = one tier down)
      const redInput = document.createElement("input");
      redInput.type = "number";
      redInput.min = "0";
      redInput.value = "0";
      redInput.className = "dh-dmg-input";

      const applyBtn = document.createElement("button");
      applyBtn.className = "dh-event-btn";
      applyBtn.textContent = "Apply";

      const dmgGroup = document.createElement("div");
      dmgGroup.className = "dh-dmg-group";
      dmgGroup.append(mkLabel("Damage"), dmgInput);

      const redGroup = document.createElement("div");
      redGroup.className = "dh-dmg-group";
      redGroup.append(mkLabel("Reduce by (tiers)"), redInput);

      row.append(dmgGroup, redGroup, applyBtn);

      /** Resolve thresholds fresh from frontmatter (preferred) or YAML fallbacks */
      const resolveThresholds = () => {
        const fm = plugin.app.metadataCache.getFileCache(file as TFile)?.frontmatter ?? {};

        // FINAL thresholds from FM or YAML
        const fmMajor = readFmNumber(fm, [
          "majorthreshold",
          "major_threshold",
          "majorThreshold",
          "major",
          "armor_major_threshold",
        ]);
        const fmSevere = readFmNumber(fm, [
          "severethreshold",
          "severe_threshold",
          "severeThreshold",
          "severe",
          "armor_severe_threshold",
        ]);

        const yamlFinalMajor = conf.major_threshold;
        const yamlFinalSevere = conf.severe_threshold;

        const level = asNum(conf.level ?? fm.level ?? fm.tier ?? 0, 0);

        let finalMajor: number;
        let finalSevere: number;
        let subtitle: string;

        if (
          yamlFinalMajor != null || yamlFinalSevere != null ||
          Number.isFinite(fmMajor) || Number.isFinite(fmSevere)
        ) {
          finalMajor  = asNum(yamlFinalMajor ?? fmMajor ?? 0, 0);
          finalSevere = asNum(yamlFinalSevere ?? fmSevere ?? 0, 0);
          subtitle = `Final Thresholds → Major: ${finalMajor} • Severe: ${finalSevere}`;
        } else {
          // BASE fallback (YAML only)
          const baseMajor  = asNum(conf.base_major  ?? 0, 0);
          const baseSevere = asNum(conf.base_severe ?? 0, 0);
          finalMajor  = baseMajor  + level;
          finalSevere = baseSevere + level;
          subtitle = `Thresholds → Major: ${finalMajor} • Severe: ${finalSevere} (base ${baseMajor}/${baseSevere} + level ${level})`;
        }

        sub.textContent = subtitle;
        return { finalMajor, finalSevere };
      };

      // Initial preview
      resolveThresholds();

      // Apply
      applyBtn.onclick = () => {
        const { finalMajor, finalSevere } = resolveThresholds();

        if (!Number.isFinite(finalMajor) || !Number.isFinite(finalSevere)) {
          new Notice(
            "Damage: thresholds not found. Add majorthreshold/severethreshold to frontmatter, or base_major/base_severe in the block.",
            6000
          );
          return;
        }

        const rawAmt = asNum(dmgInput.value, 0);
        const tierReduce = Math.max(0, Math.floor(asNum(redInput.value, 0)));

        // Classify incoming damage into severity tiers (inclusive at thresholds):
        //  - Severe (3): amt >= Severe
        //  - Major  (2): amt >= Major
        //  - Minor  (1): amt > 0
        //  - None   (0): amt <= 0
        let startTier = 0;
        if (rawAmt >= finalSevere) startTier = 3;
        else if (rawAmt >= finalMajor) startTier = 2;
        else if (rawAmt > 0) startTier = 1;
        else startTier = 0;

        const endTier = clamp(startTier - tierReduce, 0, 3);

        const scope = getPreviewScope(el);
        const hpBoxesEl = queryBoxesInScope(scope, "dh-track-hp");
        const hpMax = maxBoxesOf(hpBoxesEl);

        const hpFilled0 = readFilled(hpKey);
        let hpFilled1 = hpFilled0 + endTier;
        if (hpMax) hpFilled1 = clamp(hpFilled1, 0, hpMax);

        writeFilled(hpKey, hpFilled1);
        paintBoxes(hpBoxesEl, hpFilled1);

        const toast =
          `Damage ${rawAmt}  —  Severity: ${tierName(startTier)} → ${tierName(endTier)} ` +
          `(reduced by ${tierReduce})  —  Now HP on: ${hpFilled1}/${hpMax || "?"}`;

        new Notice(toast, 7000);
        if (hpMax && hpFilled1 >= hpMax) {
          new Notice("You marked your last Hit Point — make a death move.", 7000);
        }
      };

      // Live-update thresholds subtitle when THIS file's frontmatter changes
      const child = new MarkdownRenderChild(el);
      child.registerEvent(
        plugin.app.metadataCache.on("changed", (changedFile) => {
          if (changedFile.path === file.path) {
            resolveThresholds();
          }
        })
      );
      child.registerEvent(
        plugin.app.metadataCache.on("resolved", () => {
          resolveThresholds();
        })
      );

      ctx.addChild(child);
    }
  );
}
