// src/lib/utils/callout.ts
// NOTE: no imports here — this file only exports the function.

export function stripCalloutMarkers(text: string): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  const out: string[] = [];

  // > [!note] Header style
  const head = /^\s*>\s*\[![^\]]+\]\s*(.*)$/;
  // > regular quoted lines
  const any  = /^\s*>\s?(.*)$/;

  for (const line of lines) {
    let m = line.match(head);
    if (m) { out.push(m[1] ?? ""); continue; }

    m = line.match(any);
    if (m) { out.push(m[1] ?? ""); continue; }

    out.push(line);
  }
  return out.join("\n");
}
