/**
 * Dashboard code block processor
 * 
 * Registers: ```dashboard
 * 
 * All-in-one character sheet component.
 * Combines:
 * - Character art/image
 * - Badges (character info)
 * - Traits/abilities
 * - Vitals (HP, stress, armor, hope trackers)
 * - Rest buttons (short/long)
 * - Damage calculator
 */
import type DaggerheartPlugin from "../main";
import { App, MarkdownPostProcessorContext, Notice, TFile } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { KVProvider } from "../components/state/kv-context";

import { BadgesView, type BadgeRow } from "../components/badges-view";
import { TrackerRowView, type TrackerKind } from "../components/trackers-view";
import { RestRowView } from "../components/rest-row";
import { AbilityView } from "../components/traits";
import { buildCards } from "../core/abilities";
import { DamageInlineView } from "../components/damage-inline";
import { applyDamage } from "../core/damage-calculator";

import { parseYamlSafe } from "../utils/yaml";
import { processTemplate, createTemplateContext } from "../utils/template";
import * as store from "../lib/services/stateStore";
import { registerLiveCodeBlock } from "../utils/liveBlock";
const roots = new WeakMap<HTMLElement, Root>();

// --- helpers for resolving frontmatter art/image to a vault resource ---
const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif", "svg"] as const;

function normalizeLinkText(v: unknown): string | null {
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  // strip wikilink wrappers and aliases
  if (s.startsWith("![[") && s.endsWith("]]")) s = s.slice(3, -2);
  if (s.startsWith("[[") && s.endsWith("]]")) s = s.slice(2, -2);
  const bar = s.indexOf("|");
  if (bar !== -1) s = s.slice(0, bar);
  return s.trim();
}

function resolveImageFile(app: App, fromFile: TFile, nameOrPath: string): TFile | null {
  const tryOne = (candidate: string): TFile | null => {
    const f = app.metadataCache.getFirstLinkpathDest(candidate, fromFile.path) as TFile | null;
    if (f && IMAGE_EXTS.includes(String(f.extension).toLowerCase() as any)) return f;
    return null;
  };
  if (/\.[a-zA-Z0-9]+$/.test(nameOrPath)) {
    return tryOne(nameOrPath);
  }
  for (const ext of IMAGE_EXTS) {
    const f = tryOne(`${nameOrPath}.${ext}`);
    if (f) return f;
  }
  return null;
}

type BadgeItem = { label?: string; value?: string | number | boolean | null };

type TrackersConf = {
  hp?: { state_key?: string; label?: string; uses?: number | string } | boolean;
  stress?: { state_key?: string; label?: string; uses?: number | string } | boolean;
  armor?: { state_key?: string; label?: string; uses?: number | string } | boolean;
  hope?: { state_key?: string; label?: string; uses?: number | string } | boolean;
};

type DamageConf = {
  title?: string;
  hp_key?: string;
  major_threshold?: number | string;
  severe_threshold?: number | string;
  base_major?: number | string;
  base_severe?: number | string;
  level?: number | string;
};

type KeysConf = { hp?: string; stress?: string; armor?: string; hope?: string };
type DashboardYaml = {
  badges?: { items?: BadgeItem[] | Record<string, BadgeItem> };
  trackers?: TrackersConf;
  rest?: { short_label?: string; long_label?: string; hp_key?: string; stress_key?: string; armor_key?: string; hope_key?: string } | boolean;
  damage?: DamageConf | boolean;
  traits?: string | Record<string, any> | boolean;
  vitals?: boolean | Record<string, any>;
  art?: boolean | string | Record<string, any>;
  keys?: KeysConf; // global per-dashboard default keys for hp/stress/armor/hope
  class?: string;
};

function asNum(v: unknown, def = 0): number {
  if (v === null || v === undefined) return def;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : def;
}

function parseDoc(src: string): DashboardYaml {
  try { return parseYamlSafe<DashboardYaml>(src) ?? {}; } catch { return {}; }
}

function resolveCount(raw: number | string | undefined, el: HTMLElement, app: App, ctx: MarkdownPostProcessorContext, fallback = 0): number {
  if (raw == null || raw === "") return fallback;
  if (typeof raw === "number") { const n = Math.floor(raw); return Number.isFinite(n) ? Math.max(0, n) : fallback; }
  try { const tctx = createTemplateContext(el, app, ctx); const out = processTemplate(String(raw), tctx).trim(); const n = Math.floor(Number(out)); return Number.isFinite(n) ? Math.max(0, n) : fallback; } catch { return fallback; }
}

function toBadgeRows(el: HTMLElement, app: App, ctx: MarkdownPostProcessorContext, items?: BadgeItem[] | Record<string, BadgeItem>): BadgeRow[] {
  const arr: BadgeItem[] = Array.isArray(items) ? items : items && typeof items === "object" ? Object.values(items) : [];
  const tctx = createTemplateContext(el, app, ctx);
  const renderVal = (raw: BadgeItem["value"]): string => {
    if (raw === null || raw === undefined) return "";
    if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
    try { return processTemplate(String(raw), tctx); } catch { return String(raw ?? ""); }
  };
  return arr.map(it => ({ label: String(it?.label ?? ""), value: renderVal(it?.value) }));
}

export function registerDashboard(plugin: DaggerheartPlugin) {
  registerLiveCodeBlock(plugin, "dashboard", async (el, src, ctx) => {
    try {
    const doc = parseDoc(src);
    const app = plugin.app;
    const file = app.vault.getFileByPath(ctx.sourcePath) || app.workspace.getActiveFile();
    if (!file) { el.createEl("pre", { text: "Dashboard: could not resolve file." }); return; }
    const fileScope = String(file.path);
    const scoped = (k: string) => `${fileScope}::${k}`;

    let root = roots.get(el);
    if (!root) { root = createRoot(el); roots.set(el, root); }
    // Apply optional custom classes to container
    const klassStr = String((doc as any).class ?? '').trim();
    const klasses = klassStr.split(/\s+/).filter(Boolean);
    el.addClass('dh-dashboard-block');
    for (const k of klasses) el.addClass(k);

    const computeKinds = () => {
      // Only render standalone trackers if the dashboard explicitly provides a `trackers` section
      if ((doc as any).trackers === undefined || (doc as any).trackers === false) return [] as Array<{ kind: TrackerKind; label: string; key: string; total: number; shape: "rect" | "diamond" }>;
      const tconf = (doc as any).trackers ?? {};
      const list: Array<{ kind: TrackerKind; label: string; key: string; total: number; shape: "rect" | "diamond" }>
        = (['hp','stress','armor','hope'] as TrackerKind[]).map((k) => {
          const raw = (tconf as any)?.[k];
          if (raw === false) return null as any;
          const obj = (raw && typeof raw === 'object') ? raw : {};
          const label = String(obj.label ?? k.toUpperCase());
          const key = String(obj.state_key ?? (k === 'hp' ? 'din_health' : k === 'stress' ? 'din_stress' : k === 'armor' ? 'din_armor' : 'din_hope'));
          const usesRaw = (typeof raw === 'object') ? (obj as any).uses : raw; // allow shorthand: hp: "{{ frontmatter.hp }}"
          const total = resolveCount(usesRaw as any, el, app as any, ctx, k === 'hope' ? 6 : 0);
          const shape: "rect" | "diamond" = (k === 'hope' ? 'diamond' : 'rect');
          return { kind: k, label, key, total, shape };
        }).filter(Boolean) as any;
      return list;
    };

    // Optional: allow "vitals:" section to provide its own counts/labels/keys without affecting standalone trackers
    const computeVitalsKinds = () => {
      const vconf = (doc as any).vitals;
      if (!vconf || typeof vconf !== 'object') return computeKinds();
      const list: Array<{ kind: TrackerKind; label: string; key: string; total: number; shape: "rect" | "diamond" }>
        = (['hp','stress','armor','hope'] as TrackerKind[]).map((k) => {
          const raw = (vconf as any)?.[k];
          if (raw === false) return null as any;
          const obj = (raw && typeof raw === 'object') ? raw : {};
          const label = String(obj.label ?? k.toUpperCase());
          const key = String(obj.state_key ?? (k === 'hp' ? 'din_health' : k === 'stress' ? 'din_stress' : k === 'armor' ? 'din_armor' : 'din_hope'));
          const usesRaw = (typeof raw === 'object') ? (obj as any).uses : raw;
          const total = resolveCount(usesRaw as any, el, app as any, ctx, k === 'hope' ? 6 : 0);
          const shape: "rect" | "diamond" = (k === 'hope' ? 'diamond' : 'rect');
          return { kind: k, label, key, total, shape };
        }).filter(Boolean) as any;
      return list;
    };

    const resolveDamageThresholds = () => {
      const dconf = (doc.damage === true ? {} : (doc.damage || {})) as DamageConf;
      const fm = app.metadataCache.getFileCache(file as TFile)?.frontmatter ?? {};
      const getFmNum = (names: string[]): number => { for (const n of names) { if (fm[n] !== undefined) return asNum(fm[n], NaN); } return NaN; };
      const fmMajor = getFmNum(["majorthreshold","major_threshold","majorThreshold","major","armor_major_threshold"]);
      const fmSevere = getFmNum(["severethreshold","severe_threshold","severeThreshold","severe","armor_severe_threshold"]);
      const level = asNum((dconf as any).level ?? fm.level ?? fm.tier ?? 0, 0);
      const tctx = createTemplateContext(el, app as any, ctx);
      const resolveNum = (raw: unknown, fallback: number): number => {
        if (typeof raw === 'number') return asNum(raw, fallback);
        if (typeof raw === 'string') { try { const out = processTemplate(raw, tctx).trim(); const n = Number(out); if (Number.isFinite(n)) return n; } catch {} }
        return fallback;
      };
      let finalMajor: number; let finalSevere: number; let subtitle: string;
      if ((dconf as any).major_threshold != null || (dconf as any).severe_threshold != null || Number.isFinite(fmMajor) || Number.isFinite(fmSevere)){
        const srcMajor = resolveNum((dconf as any).major_threshold, Number.isFinite(fmMajor)? fmMajor: 0);
        const srcSevere = resolveNum((dconf as any).severe_threshold, Number.isFinite(fmSevere)? fmSevere: 0);
        finalMajor = srcMajor + level;
        finalSevere = srcSevere + level;
        subtitle = `Final thresholds — Major: ${srcMajor} + level ${level} = ${finalMajor} • Severe: ${srcSevere} + level ${level} = ${finalSevere}`;
      } else {
        const baseMajor = asNum((dconf as any).base_major ?? 0, 0);
        const baseSevere = asNum((dconf as any).base_severe ?? 0, 0);
        finalMajor = baseMajor + level; finalSevere = baseSevere + level;
        subtitle = `Thresholds — Major: ${finalMajor} • Severe: ${finalSevere} (base ${baseMajor}/${baseSevere} + level ${level})`;
      }
      return { finalMajor, finalSevere, subtitle };
    };

    const render = async () => {
      const badgeRows = toBadgeRows(el, app as any, ctx, doc.badges?.items);
      const kinds = computeKinds();
      const vitalsKinds = computeVitalsKinds();
      const { finalMajor, finalSevere, subtitle } = resolveDamageThresholds();

      // Resolve optional art/image when enabled via YAML: `art: true` or `art: <path|wikilink|url>`
      const fm = app.metadataCache.getFileCache(file as TFile)?.frontmatter ?? {};
      const artEnable = (doc as any).art;
      let artNode: any = null;
      try {
        if (artEnable) {
          let candidate: string | null = null;
          if (artEnable === true) {
            candidate = normalizeLinkText((fm as any)?.art ?? (fm as any)?.image);
          } else if (typeof artEnable === 'string') {
            candidate = normalizeLinkText(artEnable);
          } else if (artEnable && typeof artEnable === 'object') {
            candidate = normalizeLinkText((artEnable as any).src ?? (fm as any)?.art ?? (fm as any)?.image);
          }
          if (candidate) {
            const a = (artEnable && typeof artEnable === 'object') ? (artEnable as any) : {};
            const imgStyle: React.CSSProperties = {
              width: a.width as any,
              maxHeight: a.maxHeight as any,
              objectFit: a.fit as any,
              borderRadius: a.radius as any,
            };
            const wrapStyle: React.CSSProperties = {
              textAlign: (a.align === 'right' ? 'right' : a.align === 'center' ? 'center' : a.align === 'left' ? 'left' : undefined)
            };

            if (/^https?:\/\//i.test(candidate)) {
              artNode = React.createElement('div', { className: 'dh-dash-art', style: wrapStyle },
                React.createElement('img', { src: candidate, alt: 'art', className: 'dh-art-img', style: imgStyle })
              );
            } else {
              const imgFile = resolveImageFile(app as any, file as TFile, candidate);
              if (imgFile) {
                const url = (app as any).vault.getResourcePath(imgFile);
                artNode = React.createElement('div', { className: 'dh-dash-art', style: wrapStyle },
                  React.createElement('img', { src: url, alt: imgFile.basename, className: 'dh-art-img', style: imgStyle })
                );
              }
            }
          }
        }
      } catch {}

      const resolveKey = (kind: 'hp'|'stress'|'armor'|'hope') => {
        const restConf = (doc.rest === true ? {} : (doc.rest || {})) as any;
        const keysConf = ((doc as any).keys || {}) as any;
        const vitKey = vitalsKinds.find(k=>k.kind===kind)?.key;
        const stdKey = kinds.find(k=>k.kind===kind)?.key;
        const restKey = restConf?.[`${kind}_key`];
        const prefKey = keysConf?.[kind];
        return String(restKey ?? prefKey ?? vitKey ?? stdKey ?? (kind==='hp'?'din_health':kind==='stress'?'din_stress':kind==='armor'?'din_armor':'din_hope'));
      };

      const onShort = () => plugin && (require('./short-rest') as any).openShortRestUI
        ? (require('./short-rest') as any).openShortRestUI(plugin, el, ctx, {
            hp: scoped(resolveKey('hp')),
            stress: scoped(resolveKey('stress')),
            armor: scoped(resolveKey('armor')),
            hope: scoped(resolveKey('hope')),
          })
        : null;

      const onLong = () => plugin && (require('./long-rest') as any).openLongRestUI
        ? (require('./long-rest') as any).openLongRestUI(plugin, el, ctx, {
            hp: scoped(resolveKey('hp')),
            stress: scoped(resolveKey('stress')),
            armor: scoped(resolveKey('armor')),
            hope: scoped(resolveKey('hope')),
          })
        : null;

      const restConf = (doc.rest === true ? {} : (doc.rest || {})) as { short_label?: string; long_label?: string };
      const shortLabel = String(restConf.short_label ?? 'Short Rest');
      const longLabel = String(restConf.long_label ?? 'Long Rest');

      // Preload values for vitals trackers only
      const savedMap = new Map<string, number>();
      await Promise.all(
        vitalsKinds.map(async (k) => {
          const sk = scoped(k.key);
          const v = Number(await store.get<number>(`tracker:${sk}`, 0) ?? 0);
          savedMap.set(sk, Math.max(0, Math.min(k.total, v)));
        })
      );

      // Traits (optional)
      let traitsNode: any = null;
      try {
        const tconf = (doc as any).traits;
        if (tconf) {
          const srcStr = typeof tconf === 'string' ? tconf : JSON.stringify(tconf);
          const cards = buildCards(file.path, srcStr);
          if (cards && cards.length) {
            traitsNode = React.createElement('div', { className: 'dh-dash-traits' }, React.createElement(AbilityView, { data: cards }));
          }
        }
      } catch {}

      const vitalsFiltered = vitalsKinds.filter(k => (k.total ?? 0) > 0);
      const vitalsNode = ((doc as any).vitals && vitalsFiltered.length)
        ? React.createElement(
            'div',
            { className: 'dh-dash-vitals' },
            React.createElement(
              'div',
              { className: 'dh-vitals' },
              React.createElement(
                'div',
                { className: 'dh-vitals-grid' },
                vitalsFiltered.map((k) => {
                  const sk = scoped(k.key);
                  return React.createElement(TrackerRowView, {
                    key: `vitals:${k.kind}:${sk}`,
                    label: k.label,
                    kind: k.kind,
                    shape: k.shape,
                    total: k.total,
                    initialFilled: savedMap.get(sk) ?? 0,
                    stateKey: sk,
                    onChange: async (filled: number) => {
                      const v = Math.max(0, Math.min(k.total, filled));
                      await store.set<number>(`tracker:${sk}`, v);
                      try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: sk, filled: v } })); } catch {}
                    }
                  })
                })
              )
            )
          )
        : null;

      // Actions row (rest + ops + damage)
      const actionsNode = React.createElement(
        'div',
        { className: 'dh-dash-actions' },
        React.createElement(
          'div',
          { className: 'dh-dash-rest' },
          React.createElement(RestRowView as any, { shortLabel, longLabel, onShort: onShort as any, onLong: onLong as any }),
          React.createElement(
            'div',
            { className: 'dh-dash-ops' },
            React.createElement('button', { className: 'dh-event-btn', onClick: async ()=>{ try { const ok = await (require('../lib/services/stateStore') as any).undoLast(); if(!ok) new Notice('Nothing to undo'); } catch(e){ console.error(e);} } }, 'Undo'),
            React.createElement('button', { className: 'dh-event-btn', onClick: async ()=>{ try { const ok = await (require('../lib/services/stateStore') as any).redoLast(); if(!ok) new Notice('Nothing to redo'); } catch(e){ console.error(e);} } }, 'Redo'),
            React.createElement('button', { className: 'dh-event-btn', onClick: async ()=>{ try { const hpK=scoped(resolveKey('hp')), stK=scoped(resolveKey('stress')), arK=scoped(resolveKey('armor')); await store.set('tracker:'+hpK, 0); await store.set('tracker:'+stK,0); await store.set('tracker:'+arK,0); try { window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: hpK, filled: 0 } })); window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: stK, filled: 0 } })); window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: arK, filled: 0 } })); } catch {} new Notice('Full heal applied'); } catch(e){ console.error(e);} } }, 'Full heal'),
            React.createElement('button', { className: 'dh-event-btn', onClick: async ()=>{ try {
              // Reset all trackers to 0
              const hpK=scoped(resolveKey('hp')), stK=scoped(resolveKey('stress')), arK=scoped(resolveKey('armor')), hoK=scoped(resolveKey('hope'));
              await store.set('tracker:'+hpK,0); await store.set('tracker:'+stK,0); await store.set('tracker:'+arK,0); await store.set('tracker:'+hoK,0);
              try {
                window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: hpK, filled: 0 } }));
                window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: stK, filled: 0 } }));
                window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: arK, filled: 0 } }));
                window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: hoK, filled: 0 } }));
              } catch {}

              // Clear all trait toggles for this note
              try {
                const filePath = (file as TFile).path;
                const names = ['Agility','Strength','Finesse','Instinct','Presence','Knowledge'];
                for (const n of names) localStorage.removeItem(`dh:traitToggle:${filePath}:${n}`);
                try { window.dispatchEvent(new CustomEvent('dh:ability:refresh', { detail: { filePath } })); } catch {}
              } catch {}

              // Clear all Level Up usage and marked traits in frontmatter
              try {
                await plugin.app.fileManager.processFrontMatter(file as TFile, (front:any)=>{
                  front.dh_marked_traits = [];
                  if (front.dh_levelup && typeof front.dh_levelup === 'object') {
                    // Reset per-tier records
                    front.dh_levelup = {};
                  }
                });
              } catch (e) { console.error(e); }

              // Re-render Level Up embed if present
              try {
                const host = el.querySelector('.dh-dash-levelup-embed') as HTMLElement | null;
                if (host) {
                  host.empty?.();
                  delete (host as any).dataset?.rendered;
                  host.classList.add('hidden');
                }
              } catch {}

              new Notice('All reset: trackers cleared, trait toggles removed, and level-up options reset');
            } catch(e){ console.error(e);} } }, 'Reset all')
          )
        ),
        React.createElement(
          'div',
          { className: 'dh-dash-damage' },
          React.createElement(DamageInlineView as any, {
            title: String((doc.damage && (doc.damage as any).title) || 'Damage'),
            majorThreshold: finalMajor,
            severeThreshold: finalSevere,
            onApply: async (rawAmtInput: number, tierReduceInput: number) => {
              const { finalMajor, finalSevere } = resolveDamageThresholds();
                      const resolvedHpKey = scoped(String(((doc.damage===true?{}: (doc.damage||{})) as any).hp_key ?? resolveKey('hp')));
              const rawAmt = asNum(rawAmtInput, 0);
              const tierReduce = Math.max(0, Math.floor(asNum(tierReduceInput, 0)));
              const scope = (el.closest('.markdown-preview-view') as HTMLElement) ?? document.body;
                      const armorKeyRaw = vitalsKinds.find(k=>k.kind==='armor')?.key ?? kinds.find(k=>k.kind==='armor')?.key ?? 'din_armor';
                      const armorKey = scoped(String(armorKeyRaw));
              const result = await applyDamage({ rawAmt, tierReduce, finalMajor, finalSevere, hpKey: resolvedHpKey, armorKey, scope });
              if (!result.success) { new Notice(result.message || 'Damage application failed', 6000); return; }
              new Notice(result.message || 'Damage applied', 7000);
            }
          })
        )
      );

      // Level Up section (separate row, spans both columns on wide)
      const levelupNode = React.createElement(
        'div',
        { className: 'dh-dash-levelup' },
        React.createElement('button', { className: 'dh-event-btn', onClick: ()=>{ try {
          const host = el.querySelector('.dh-dash-levelup-embed') as HTMLElement || (()=>{ const d=document.createElement('div'); d.className='dh-dash-levelup-embed dh-levelup-body hidden'; el.appendChild(d); return d; })();
          if (!host.dataset.rendered) { (require('./level-up') as any).renderInlineLevelUp?.(plugin, host, ctx, true); host.dataset.rendered='1'; }
          if (host.classList.contains('hidden')) { host.classList.remove('hidden'); } else { host.classList.add('hidden'); }
        } catch(e){ console.error(e);} } }, 'Level Up'),
        React.createElement('div', { className: 'dh-dash-levelup-embed dh-levelup-body hidden' })
      );

      // Build per-dashboard data attributes from YAML
      const dashAttrs: Record<string, any> = { className: 'dh-dashboard' + (klasses && klasses.length ? (' ' + klasses.join(' ')) : '') };
      try {
        const s: any = (doc as any);
        const surface = String(s.surface || '').trim(); if (surface === 'minimal' || surface === 'card') (dashAttrs as any)['data-surface'] = surface;
        if (s.compact === true) (dashAttrs as any)['data-compact'] = 'true';
        const hover = String(s.hover || '').trim(); if (hover === 'off' || hover === 'on') (dashAttrs as any)['data-hover'] = hover;
        const extra = (s.attrs && typeof s.attrs === 'object') ? s.attrs : {};
        for (const [k,v] of Object.entries(extra)) { (dashAttrs as any)[k] = v as any; }
      } catch {}
      const dash = React.createElement(
        'div', dashAttrs,
        artNode,
        badgeRows.length ? React.createElement('div', { className: 'dh-dash-badges' }, React.createElement(BadgesView, { items: badgeRows })) : null,
        traitsNode,
        vitalsNode,
        actionsNode,
        levelupNode
      );

      root!.render(
        React.createElement(ErrorBoundary, { name: 'Dashboard' },
          React.createElement(KVProvider, null, dash)
        )
      );

      // no manual DOM hydration; components mount with initialFilled and update via events
    };

    await render();
    } catch (e:any) {
      try { console.error('[DH-UI] dashboard render error', e); } catch {}
      try { el.empty(); el.createEl('pre', { text: `Dashboard error: ${e?.message || e}` }); } catch {}
    }
  });
}



