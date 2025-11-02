// src/blocks/level-up.ts
import type DaggerheartPlugin from "../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, Notice, TFile } from "obsidian";
import { LevelUpModal } from "../ui/levelup-modal";


export function renderInlineLevelUp(plugin: DaggerheartPlugin, el: HTMLElement, ctx: MarkdownPostProcessorContext){
  const file = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
  el.empty();
  el.addClass('dh-levelup');
  const header = el.createDiv({ cls: 'dh-levelup-header' });
  const openModalBtn = header.createEl('button', { cls: 'dh-event-btn', text: 'Open Level Up' });
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
    renderInlineLevelUp(plugin, el, ctx);
    const child = new MarkdownRenderChild(el); ctx.addChild(child);
  });
}
