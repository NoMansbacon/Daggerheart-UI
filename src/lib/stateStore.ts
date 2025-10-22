import type DaggerheartPlugin from "../main";
import { normalizePath, TFile } from "obsidian";

/**
 * A tiny vault-wide JSON key/value store:
 * - Backed by a single file (path in plugin settings).
 * - Debounced writes to avoid thrashing.
 * - Keys are GLOBAL across the vault (use unique names).
 */

type StateMap = Record<string, any>;

let pluginRef: DaggerheartPlugin | null = null;
let storePath = ".obsidian/plugins/dh_state.json";
let cache: StateMap = {};
let loaded = false;
let saveTimer: number | null = null;

export function initializeStateStore(plugin: DaggerheartPlugin, pathFromSettings?: string) {
  pluginRef = plugin;
  if (pathFromSettings && pathFromSettings.trim()) {
    storePath = normalizePath(pathFromSettings.trim());
  }
  // Reset cache so we reload if path changed
  loaded = false;
  cache = {};
}

async function ensureLoaded() {
  if (loaded) return;
  if (!pluginRef) throw new Error("stateStore: plugin not initialized");
  const adapter = pluginRef.app.vault.adapter;
  try {
    if (await adapter.exists(storePath)) {
      const raw = await adapter.read(storePath);
      cache = JSON.parse(raw || "{}") ?? {};
    } else {
      // ensure parent dir exists
      const parts = storePath.split("/");
      if (parts.length > 1) {
        const dir = parts.slice(0, -1).join("/");
        if (!(await adapter.exists(dir))) {
          await adapter.mkdir(dir);
        }
      }
      cache = {};
      await adapter.write(storePath, JSON.stringify(cache, null, 2));
    }
  } catch (e) {
    console.error("[Daggerheart] Failed to read state file:", e);
    cache = {};
  }
  loaded = true;
}

function scheduleSave() {
  if (!pluginRef) return;
  if (saveTimer != null) window.clearTimeout(saveTimer);
  // debounce ~250ms
  saveTimer = window.setTimeout(async () => {
    try {
      const adapter = pluginRef!.app.vault.adapter;
      await adapter.write(storePath, JSON.stringify(cache, null, 2));
    } catch (e) {
      console.error("[Daggerheart] Failed to write state file:", e);
    }
  }, 250) as unknown as number;
}

/** Read a value by global state_key */
export async function getState<T = any>(key: string): Promise<T | undefined> {
  await ensureLoaded();
  return cache[key] as T | undefined;
}

/** Write a value by global state_key */
export async function setState<T = any>(key: string, value: T): Promise<void> {
  await ensureLoaded();
  cache[key] = value;
  scheduleSave();
}

/** Get an array<boolean> of a certain length; pads/trims as needed. */
export async function getBoolArray(key: string, len: number): Promise<boolean[]> {
  await ensureLoaded();
  const raw = cache[key];
  let arr: boolean[] = Array.isArray(raw) ? raw.map(Boolean) : [];
  if (arr.length > len) arr = arr.slice(0, len);
  while (arr.length < len) arr.push(false);
  cache[key] = arr; // keep normalized
  return arr;
}

/** Save an array<boolean> */
export async function setBoolArray(key: string, arr: boolean[]): Promise<void> {
  await ensureLoaded();
  cache[key] = arr.map(Boolean);
  scheduleSave();
}
