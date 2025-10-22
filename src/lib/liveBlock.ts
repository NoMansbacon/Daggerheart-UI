import type DaggerheartPlugin from "../main";
import type { MarkdownPostProcessorContext, TFile } from "obsidian";

/**
 * Live-updating codeblock registry.
 * Usage:
 *   registerLiveCodeBlock(plugin, "badges", (el, src, ctx) => { ... });
 *
 * - Renders on first pass
 * - Tracks instances per file
 * - On frontmatter/metadata change for that file, re-runs the **correct renderer**
 *   for each root (fixes the bug where one renderer was used for all blocks).
 */

type Renderer = (el: HTMLElement, src: string, ctx: MarkdownPostProcessorContext) => void;

const instancesByFile = new Map<string, Set<HTMLElement>>();                // filePath -> roots
const srcByRoot = new WeakMap<HTMLElement, string>();                       // root -> original src
const ctxByRoot = new WeakMap<HTMLElement, MarkdownPostProcessorContext>(); // root -> ctx
const rendererByRoot = new WeakMap<HTMLElement, Renderer>();                // root -> renderer

let listenerInstalled = false;

export function registerLiveCodeBlock(
  plugin: DaggerheartPlugin,
  name: string,
  renderer: Renderer
) {
  // Install the global metadata change listener once
  if (!listenerInstalled) {
    plugin.registerEvent(
      plugin.app.metadataCache.on("changed", (file: TFile) => {
        const path = file?.path;
        if (!path) return;
        const roots = instancesByFile.get(path);
        if (!roots) return;

        for (const root of Array.from(roots)) {
          if (!root.isConnected) {
            roots.delete(root);
            continue;
          }

          const render = rendererByRoot.get(root);
          const src = srcByRoot.get(root);
          const oldCtx = ctxByRoot.get(root);
          if (!render || src == null || !oldCtx) continue;

          // Build a fresh ctx-like object with updated frontmatter
          const fm = plugin.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
          const freshCtx: MarkdownPostProcessorContext = {
            ...oldCtx,
            // @ts-expect-error: Obsidian provides frontmatter to postprocessors; we refresh it here
            frontmatter: fm,
          };

          root.empty();
          render(root, src, freshCtx);
        }
      })
    );
    listenerInstalled = true;
  }

  // Register the named code block
  plugin.registerMarkdownCodeBlockProcessor(name, (src, el, ctx) => {
    // Initial render
    renderer(el, src, ctx);

    // Track for future refreshes (per-root)
    srcByRoot.set(el, src);
    ctxByRoot.set(el, ctx);
    rendererByRoot.set(el, renderer);

    const filePath = ctx.sourcePath;
    let set = instancesByFile.get(filePath);
    if (!set) {
      set = new Set();
      instancesByFile.set(filePath, set);
    }
    set.add(el);

    // Auto-clean when removed
    queueMicrotask(() => {
      if (!el.isConnected) {
        set?.delete(el);
        srcByRoot.delete(el);
        ctxByRoot.delete(el);
        rendererByRoot.delete(el);
      }
    });
  });
}
