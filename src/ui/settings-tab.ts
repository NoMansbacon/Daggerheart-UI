// src/ui/settings-tab.ts
import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type DaggerheartPlugin from "../main";
// No grid/layout settings UI; simplified settings tab

export class DaggerheartSettingTab extends PluginSettingTab {
  private plugin: DaggerheartPlugin;

  constructor(app: App, plugin: DaggerheartPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Daggerheart UI Settings" });

    new Setting(containerEl)
      .setName("State file path")
      .setDesc(
        "Vault-relative path to the JSON file used for plugin state (e.g., trackers)."
      )
      .addText((text) => {
        text
          .setPlaceholder(".obsidian/plugins/dh_state.json")
          .setValue(this.plugin.settings.stateFilePath || "")
          .onChange(async (value) => {
            this.plugin.settings.stateFilePath = value.trim() || ".obsidian/plugins/dh_state.json";
            await this.plugin.saveSettings();
            // Reinitialize state store with new path
            try {
              await this.plugin.initializeStore();
            } catch (e) {
              console.error("[DH-UI] Failed to reinitialize state store:", e);
            }
          });
      });

    // Dashboard art defaults
    containerEl.createEl("h3", { text: "Dashboard Art Defaults" });

    new Setting(containerEl)
      .setName("Art width")
      .setDesc("Any CSS size (e.g., 320px, 50%, 20rem)")
      .addText((t) =>
        t
          .setPlaceholder("320px")
          .setValue(this.plugin.settings.artWidth || "")
          .onChange(async (v) => {
            this.plugin.settings.artWidth = v.trim() || undefined;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Art max height")
      .setDesc("Constrain image height (e.g., 220px)")
      .addText((t) =>
        t
          .setPlaceholder("220px")
          .setValue(this.plugin.settings.artMaxHeight || "")
          .onChange(async (v) => {
            this.plugin.settings.artMaxHeight = v.trim() || undefined;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Art fit")
      .setDesc("CSS object-fit")
      .addDropdown((d) => {
        const opts = { contain: "contain", cover: "cover", fill: "fill", none: "none", "scale-down": "scale-down" } as const;
        Object.keys(opts).forEach((k) => d.addOption(k, opts[k as keyof typeof opts]));
        d.setValue((this.plugin.settings.artFit || 'contain') as string);
        d.onChange(async (v) => {
          this.plugin.settings.artFit = (v as any);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Art border radius")
      .setDesc("e.g., 8px")
      .addText((t) =>
        t
          .setPlaceholder("8px")
          .setValue(this.plugin.settings.artRadius || "")
          .onChange(async (v) => {
            this.plugin.settings.artRadius = v.trim() || undefined;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Art alignment")
      .setDesc("Image horizontal alignment")
      .addDropdown((d) => {
        const opts = { left: "left", center: "center", right: "right" } as const;
        Object.keys(opts).forEach((k) => d.addOption(k, opts[k as keyof typeof opts]));
        d.setValue((this.plugin.settings.artAlign || 'center') as string);
        d.onChange(async (v) => {
          this.plugin.settings.artAlign = (v as any);
          await this.plugin.saveSettings();
        });
      });

    // Save and apply (updates CSS variables so dashboards update instantly)
    new Setting(containerEl)
      .addButton((b) => b.setButtonText("Save and apply")
        .setCta()
        .onClick(async () => {
          await this.plugin.saveSettings();
          try { this.plugin.applyGlobalArtCssVars(); } catch {}
          try { new Notice('Dashboard art settings applied'); } catch {}
        })
      );

    // Template preview
    containerEl.createEl("h3", { text: "Template Preview" });
    const previewWrap = containerEl.createDiv({ cls: 'dh-template-preview' });
    const input = new (Setting as any)(previewWrap).settingEl.createEl('textarea', { cls: 'dh-template-input', attr: { rows: '3', placeholder: "Enter a template, e.g. {{ frontmatter.level }}" } }) as HTMLTextAreaElement;
    const out = previewWrap.createDiv({ cls: 'dh-template-output' });
    const render = () => {
      try {
        const app = this.app;
        const file = app.workspace.getActiveFile();
        const fm = file ? (app.metadataCache.getFileCache(file)?.frontmatter ?? {}) : {};
        // create a minimal mdctx so createTemplateContext can build a context
        const mdctx: any = { sourcePath: file?.path || '', getSectionInfo: (_: any)=> undefined };
        const ctx = (require('../utils/template') as any).createTemplateContext(document.body, app, mdctx, fm);
        const text = String(input.value || '');
        const outStr = (require('../utils/template') as any).processTemplate(text, ctx);
        out.setText(outStr);
      } catch (e) { out.setText(''); }
    };
    input.addEventListener('input', render);
    render();

    // Grid/layout customization removed by request; CSS drives layout via container queries
  }
}
