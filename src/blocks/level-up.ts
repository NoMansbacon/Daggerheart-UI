// src/blocks/level-up.ts
import type DaggerheartPlugin from "../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, Notice, TFile } from "obsidian";
import { LevelUpModal } from "../ui/levelup-modal";
import { parseYamlSafe } from "../utils/yaml";


type LevelupYaml = {
  label?: string;
  levelup_label?: string;
  styleClass?: string;
};

export function renderInlineLevelUp(
  plugin: DaggerheartPlugin,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  src: string
) {
  el.empty();
  el.addClass('dh-levelup');

  let y: LevelupYaml = {};
  try {
    y = parseYamlSafe<LevelupYaml>(src) ?? {};
  } catch {
    y = {};
  }

  const label = (y.label ?? y.levelup_label ?? 'Open Level Up').toString();
  const klass = String(y.styleClass ?? '').trim();
  if (klass) el.addClass(klass);

  const header = el.createDiv({ cls: 'dh-levelup-header' });
  const openModalBtn = header.createEl('button', { cls: 'dh-event-btn', text: label });
  openModalBtn.onclick = () => {
    const f = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
    if (f && f instanceof TFile) {
      new LevelUpModal(plugin.app as any, plugin, f).open();
    } else {
      new Notice('Level Up: could not resolve file for modal');
    }
  };
}

export function registerLevelUp(plugin: DaggerheartPlugin){
  plugin.registerMarkdownCodeBlockProcessor('levelup', async (src, el, ctx) => {
    el.empty();
    renderInlineLevelUp(plugin, el, ctx, src ?? '');
    const child = new MarkdownRenderChild(el); ctx.addChild(child);
  });
}
