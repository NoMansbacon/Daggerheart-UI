/**
 * Main plugin entry point
 * 
 * Responsibilities:
 * - Initialize plugin on load
 * - Register all code block processors (badges, consumables, trackers, rest, damage, etc.)
 * - Load and save plugin settings
 * - Initialize state store for tracker persistence
 */
import { Plugin, Notice, App, MarkdownPostProcessorContext } from "obsidian";
import { DEFAULT_SETTINGS, DaggerheartSettings } from "./settings";
import { initializeStateStore } from "./lib/services/stateStore";
import { DaggerheartSettingTab } from "./ui/settings-tab";

// React ability/traits renderer
import { AbilityScoreView } from "./components/abilityscoreview";

// Block registrations
import { registerBadgesBlock } from "./blocks/badges";
import { registerConsumablesBlock } from "./blocks/consumables-block";
import { registerTrackersBlocks } from "./blocks/trackers-block";
import { registerShortRest } from "./blocks/short-rest";
import { registerLongRest } from "./blocks/long-rest";
import { registerDamage } from "./blocks/damage-vault";
import { registerRest } from "./blocks/rest";
import { registerDashboard } from "./blocks/dashboard";
import { registerVitals } from "./blocks/vitals";
import { registerLevelUp } from "./blocks/level-up";

export default class DaggerheartPlugin extends Plugin {
  settings: DaggerheartSettings;

  applyGlobalArtCssVars() {
    try {
      const r = document.documentElement as HTMLElement;
      const set = (k: string, v?: string) => { if (v && String(v).trim()) r.style.setProperty(k, String(v).trim()); else r.style.removeProperty(k); };
      set('--dh-art-w', this.settings.artWidth);
      set('--dh-art-maxh', this.settings.artMaxHeight);
      set('--dh-art-fit', this.settings.artFit as any);
      set('--dh-art-radius', this.settings.artRadius);
      set('--dh-art-align', this.settings.artAlign as any);
    } catch {}
  }

  async onload() {
    // Load settings and initialize state store
    await this.loadSettings();
    await this.initializeStore();
    this.applyGlobalArtCssVars();
    this.addSettingTab(new DaggerheartSettingTab(this.app as App, this));
    console.log('[DH-UI] loaded');

    // Ability / Traits (React)
    const renderAbilities = (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      try {
        const view = new AbilityScoreView(this.app as App);
        el.empty();
        view.render(src, el, ctx);
      } catch (e) {
        console.error('[DH-UI] AbilityScoreView render error:', e);
        const pre = el.createEl('pre');
        pre.setText('Error rendering abilities/traits block. See console for details.');
      }
    };
    this.registerMarkdownCodeBlockProcessor('ability', renderAbilities);
    this.registerMarkdownCodeBlockProcessor('traits', renderAbilities);

    // Other processors
    try { registerBadgesBlock(this); }       catch (e) { console.error('[DH-UI] badges load error', e); }
    try { registerConsumablesBlock(this); }  catch (e) { console.error('[DH-UI] consumables load error', e); }
    try { registerTrackersBlocks(this); }    catch (e) { console.error('[DH-UI] trackers load error', e); }
    try { registerShortRest(this); }         catch (e) { console.error('[DH-UI] short-rest load error', e); }
    try { registerLongRest(this); }          catch (e) { console.error('[DH-UI] long-rest load error', e); }
    try { registerDamage(this); }            catch (e) { console.error('[DH-UI] damage load error', e); }

    // NEW: unified rest block
    try { registerRest(this); }         catch (e) { console.error('[DH-UI] rest load error', e); }
    try { registerDashboard(this); }    catch (e) { console.error('[DH-UI] dashboard load error', e); }
    try { registerVitals(this); }       catch (e) { console.error('[DH-UI] vitals load error', e); }
    try { registerLevelUp(this); }      catch (e) { console.error('[DH-UI] level-up load error', e); }

    // Grid/layout customization via settings removed; layout controlled by CSS only

    // Optional: quick reload command
    
  }

  onunload() {
    console.log('[DH-UI] unloaded');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async initializeStore() {
    const path = this.settings.stateFilePath || DEFAULT_SETTINGS.stateFilePath;
    initializeStateStore(this, path);
  }
}
