import React, { useEffect, useMemo, useRef, useState } from "react";
import { msgbus } from "../services/event-bus";
import { createTemplateContext, processTemplate } from "../utils/template";
import { getBoolArray, setBoolArray, get as getKV } from "../services/stateStore";
import yaml from "js-yaml";
import type { MarkdownPostProcessorContext } from "obsidian";

type TrackerKind = "hp" | "stress" | "armor" | "hope";

type Props = {
  kind: TrackerKind;
  yamlSrc: string;
  filePath: string;
  el: HTMLElement;             // for template context
  app: any;                    // Obsidian App
  ctx: MarkdownPostProcessorContext;
};

function toIntSafe(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.floor(v));
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const n = Number(s);
  if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  const m = s.match(/[+-]?\d+/);
  if (m) {
    const n2 = Number(m[0]);
    if (Number.isFinite(n2)) return Math.max(0, Math.floor(n2));
  }
  return 0;
}

export default function TrackersView({ kind, yamlSrc, filePath, el, app, ctx }: Props) {
  const doc = useMemo(() => {
    try { return (yaml.load(yamlSrc) ?? {}) as any; } catch { return {}; }
  }, [yamlSrc]);

  const stateKey: string = String(doc?.state_key ?? "").trim();
  const label: string = String(doc?.label ?? kind.toUpperCase());
  const rawCountVal = doc?.[kind];

  const tctxRef = useRef(createTemplateContext(el, app, ctx));
  const [count, setCount] = useState<number>(0);
  const [flags, setFlags] = useState<boolean[]>([]);

  const computeCount = () => {
    if (typeof rawCountVal === "number") return toIntSafe(rawCountVal);
    const raw = String(rawCountVal ?? "").trim();
    if (!raw) return 0;
    const processed = processTemplate(raw, tctxRef.current);
    return toIntSafe(processed);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const n = Math.max(0, Math.min(500, computeCount()));
      setCount(n);

      const raw = (await getKV<boolean[]>(stateKey, [])) ?? [];
      if (!alive) return;

      if (raw.length !== n) {
        if (raw.length > n) await setBoolArray(stateKey, raw.slice(0, n));
        else if (raw.length < n) await setBoolArray(stateKey, raw.concat(new Array(n - raw.length).fill(false)));
      }
      const next = await getBoolArray(stateKey, n);
      if (alive) setFlags(next);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey, rawCountVal]);

  useEffect(() => {
    const offFm = msgbus.subscribe(filePath, "fm:changed", (fm) => {
      const fresh = createTemplateContext(el, app, ctx);
      Object.assign(tctxRef.current.frontmatter, fresh.frontmatter);
      (async () => {
        const n = Math.max(0, Math.min(500, computeCount()));
        const raw = (await getKV<boolean[]>(stateKey, [])) ?? [];
        if (raw.length !== n) {
          if (raw.length > n) await setBoolArray(stateKey, raw.slice(0, n));
          else if (raw.length < n) await setBoolArray(stateKey, raw.concat(new Array(n - raw.length).fill(false)));
        }
        const next = await getBoolArray(stateKey, n);
        setCount(n); setFlags(next);
      })();
    });

    const offs: Array<() => void> = [];
    if (kind === "hp") {
      offs.push(msgbus.subscribe(filePath, "hp:heal", async (p: { amount: number }) => {
        const n = computeCount();
        const cur = await getBoolArray(stateKey, n);
        const used = cur.lastIndexOf(true) + 1;
        const clear = Math.min(toIntSafe(p?.amount), used);
        for (let i = used - 1; i >= used - clear; i--) if (i >= 0) cur[i] = false;
        await setBoolArray(stateKey, cur);
        setFlags(await getBoolArray(stateKey, n));
      }));
      offs.push(msgbus.subscribe(filePath, "hp:clearAll", async () => {
        const n = computeCount();
        await setBoolArray(stateKey, new Array(n).fill(false));
        setFlags(await getBoolArray(stateKey, n));
      }));
    }
    if (kind === "stress") {
      offs.push(msgbus.subscribe(filePath, "stress:clear", async (p: { amount: number }) => {
        const n = computeCount();
        const cur = await getBoolArray(stateKey, n);
        const used = cur.lastIndexOf(true) + 1;
        const clear = Math.min(toIntSafe(p?.amount), used);
        for (let i = used - 1; i >= used - clear; i--) if (i >= 0) cur[i] = false;
        await setBoolArray(stateKey, cur);
        setFlags(await getBoolArray(stateKey, n));
      }));
      offs.push(msgbus.subscribe(filePath, "stress:clearAll", async () => {
        const n = computeCount();
        await setBoolArray(stateKey, new Array(n).fill(false));
        setFlags(await getBoolArray(stateKey, n));
      }));
    }
    if (kind === "armor") {
      offs.push(msgbus.subscribe(filePath, "armor:repair", async (p: { amount: number }) => {
        const n = computeCount();
        const cur = await getBoolArray(stateKey, n);
        const used = cur.lastIndexOf(true) + 1;
        const clear = Math.min(toIntSafe(p?.amount), used);
        for (let i = used - 1; i >= used - clear; i--) if (i >= 0) cur[i] = false;
        await setBoolArray(stateKey, cur);
        setFlags(await getBoolArray(stateKey, n));
      }));
      offs.push(msgbus.subscribe(filePath, "armor:clearAll", async () => {
        const n = computeCount();
        await setBoolArray(stateKey, new Array(n).fill(false));
        setFlags(await getBoolArray(stateKey, n));
      }));
    }
    if (kind === "hope") {
      offs.push(msgbus.subscribe(filePath, "hope:add", async (p: { amount: number }) => {
        const add = Math.max(0, toIntSafe(p?.amount));
        if (!add) return;
        const n = computeCount();
        const cur = await getBoolArray(stateKey, n);
        let filled = cur.lastIndexOf(true) + 1;
        const target = Math.min(n, filled + add);
        for (let i = 0; i < target; i++) cur[i] = true;
        await setBoolArray(stateKey, cur);
        setFlags(await getBoolArray(stateKey, n));
      }));
    }

    return () => {
      offFm();
      for (const off of offs) off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, kind, stateKey]);

  const onClick = async (i: number) => {
    const n = count;
    const cur = await getBoolArray(stateKey, n);
    const targetOn = !cur[i];
    const next = new Array(n).fill(false);
    if (targetOn) for (let k = 0; k <= i; k++) next[k] = true;
    else for (let k = 0; k < i; k++) next[k] = true;
    await setBoolArray(stateKey, next);
    setFlags(await getBoolArray(stateKey, n));
  };

  const rowClass = `dh-tracker-row ${
    kind === "hp" ? "dh-tracker--hp" :
    kind === "stress" ? "dh-tracker--stress" :
    kind === "armor" ? "dh-tracker--armor" : "dh-tracker--hope"
  }`;

  return (
    <div className="dh-tracker">
      <div className="dh-tracker-label">{label}</div>
      <div className={rowClass}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`dh-track-box${flags[i] ? " on" : ""}`}
            onClick={() => onClick(i)}
          />
        ))}
      </div>
    </div>
  );
}
