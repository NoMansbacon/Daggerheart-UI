// src/lib/services/frontmatter-watch.ts
import type DaggerheartPlugin from "../../main";
import type { TFile } from "obsidian";
import { msgbus } from "./event-bus";

/**
 * Globally watches frontmatter & metadata changes and publishes a file-scoped
 * "fm:changed" message via the msgbus. Any block rendered in that file can
 * subscribe and update itself live without re-running the whole processor.
 */
export function attachFrontmatterWatcher(plugin: DaggerheartPlugin) {
  const app = plugin.app;

  const publishFor = (file: TFile | null) => {
    if (!file) return;
    try {
      const cache = app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter ?? {};
      msgbus.publish(file.path, "fm:changed", fm);
    } catch (e) {
      console.debug("[DH-UI] fm:changed publish error", e);
    }
  };

  // When the active file opens/changes
  const offOpen = app.workspace.on("file-open", (file) => publishFor(file || null));

  // Any time markdown cache for a file changes (frontmatter updates included)
  const offChanged = app.metadataCache.on("changed", (file) => publishFor(file));

  // First load / after links & metadata are resolved
  const offResolved = app.metadataCache.on("resolved", () => {
    const file = app.workspace.getActiveFile();
    publishFor(file || null);
  });

  // Clean up on plugin unload
  plugin.registerEvent({ off: () => app.workspace.offref(offOpen) } as any);
  plugin.registerEvent({ off: () => app.metadataCache.offref(offChanged) } as any);
  plugin.registerEvent({ off: () => app.metadataCache.offref(offResolved) } as any);

  console.log("[DH-UI] frontmatter watcher attached");
}
