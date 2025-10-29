// src/lib/utils/codeblock-extractor.ts
import { stripCalloutMarkers } from "./callout";

/**
 * Extract all code blocks of a specific language from a markdown string.
 * Strips callout quoting first so blocks in callouts are still found.
 */
export function extractCodeBlocks(text: string, blockType: string): string[] {
  const cleaned = stripCalloutMarkers(text);
  const pattern = new RegExp("\\`\\`\\`" + esc(blockType) + "[\\s\\S]*?\\`\\`\\`", "g");
  const matches = cleaned.match(pattern);
  if (!matches) return [];
  return matches.map((m) =>
    m.replace(new RegExp("\\`\\`\\`" + esc(blockType) + "|\\`\\`\\`", "g"), "").trim()
  );
}

/** Return the first block of that type, or null. */
export function extractFirstCodeBlock(text: string, blockType: string): string | null {
  const blocks = extractCodeBlocks(text, blockType);
  return blocks.length ? blocks[0] : null;
}

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
