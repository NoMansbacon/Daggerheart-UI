/**
 * Unified rest code block processor
 * 
 * Registers: ```rest
 * 
 * Displays both short and long rest buttons.
 * Opens modals for:
 * - Short rest (choose 2 moves, 1d4 + tier healing)
 * - Long rest (choose 2 moves, full recovery options)
 * 
 * Integrates with vitals trackers for HP/stress/armor/hope updates.
 */
import type DaggerheartPlugin from "../main";
import { MarkdownPostProcessorContext, Notice, TFile } from "obsidian";
import { parseYamlSafe } from "../utils/yaml";
import { openShortRestUI } from "./short-rest";
import { openLongRestUI } from "./long-rest";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { RestRowView } from "../components/rest-row";
import { registerLiveCodeBlock } from "../utils/liveBlock";
import * as store from "../lib/services/stateStore";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { KVProvider } from "../components/state/kv-context";
const roots = new WeakMap<HTMLElement, Root>();

type RestYaml = {
  short_label?: string;
  long_label?: string;
  hp_key?: string;
  stress_key?: string;
  armor_key?: string;
  hope_key?: string;
  class?: string;
};

function parseYaml(src: string): RestYaml {
  try { return parseYamlSafe<RestYaml>(src) ?? {}; } catch { return {}; }
}

export function registerRest(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "rest", async (el: HTMLElement, src: string, ctx: MarkdownPostProcessorContext) => {

      const conf = parseYaml(src);
      const klass = String(conf.class ?? '').trim().split(/\s+/).filter(Boolean)[0];
      el.addClass('dh-rest-block');
      if (klass) el.addClass(klass);
      // Prefer provided keys, but auto-detect from visible trackers if not supplied
      const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
      const detectKey = (cls: string, fallback: string) => {
        // Find the first tracker row for this type and read its data-dh-key
        const n = scope.querySelector(`.dh-tracker-boxes.${cls}`)?.closest('.dh-tracker') as HTMLElement | null;
        const k = (n?.getAttribute('data-dh-key') || '').trim();
        return k || fallback;
      };
      const hpKey     = String(conf.hp_key     ?? detectKey('dh-track-hp',     "din_health"));
      const stressKey = String(conf.stress_key ?? detectKey('dh-track-stress', "din_stress"));
      const armorKey  = String(conf.armor_key  ?? detectKey('dh-track-armor',  "din_armor"));
      const hopeKey   = String(conf.hope_key   ?? detectKey('dh-track-hope',   "din_hope"));

      const mk = (scope: HTMLElement, cls: string, key: string) => ({
        getMax: () => (scope.querySelector(`.dh-tracker-boxes.${cls}`)?.querySelectorAll('.dh-track-box').length ?? 0),
        repaint: () => {
          const cont = scope.querySelector(`.dh-tracker-boxes.${cls}`);
          if (!cont) return;
          store.get<number>(`tracker:${key}`, 0).then((val) => {
            const filled = Number(val ?? 0) || 0;
            cont.querySelectorAll('.dh-track-box').forEach((n, i) => (n as HTMLDivElement).classList.toggle('on', i < filled));
          });
        },
      });

      const render = () => {
        const shortLabel = String(conf.short_label ?? "Short Rest");
        const longLabel = String(conf.long_label ?? "Long Rest");
        let r = roots.get(el);
        if (!r) { r = createRoot(el); roots.set(el, r); }
        r.render(
          React.createElement(ErrorBoundary, { name: 'Rest' },
            React.createElement(KVProvider, null,
              React.createElement(RestRowView, {
                shortLabel,
                longLabel,
                onShort: () => openShortRestUI(plugin, el, ctx, { hp: hpKey, stress: stressKey, armor: armorKey, hope: hopeKey }),
                onLong: () => openLongRestUI(plugin, el, ctx, { hp: hpKey, stress: stressKey, armor: armorKey, hope: hopeKey }),
              })
            )
          )
        );
      };
      render();
  });
}
