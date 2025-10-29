import type DaggerheartPlugin from "../../main";
import { KeyValueStore } from "./kv/kv";
import { JsonDataStore } from "./kv/local-file-store";

let kv: KeyValueStore | null = null;
let currentPath: string | null = null;

// --- simple global history for tracker changes ---
type Hist = { key: string; prev: any; next: any; ts: number };
let undoStack: Hist[] = [];
let redoStack: Hist[] = [];
const MAX_HIST = 100;

export function initializeStateStore(plugin: DaggerheartPlugin, filePath: string){
  if (!kv || currentPath !== filePath){
    kv = new KeyValueStore(new JsonDataStore(plugin.app.vault, filePath));
    currentPath = filePath;
    console.log("[DH-UI] state store:", filePath);
  }
}
function K(){ if (!kv) throw new Error("State store not initialized"); return kv; }

export async function get<T>(key: string, fallback?: T): Promise<T>{
  const v = await K().get<T>(key);
  return (v === undefined ? (fallback as T) : v) as T;
}
export async function set<T>(key: string, val: T){
  // record history for tracker:* keys only
  try {
    if (key.startsWith('tracker:')){
      const prev = await K().get<any>(key);
      undoStack.push({ key, prev, next: val, ts: Date.now() });
      if (undoStack.length > MAX_HIST) undoStack.shift();
      // clear redo on new action
      redoStack = [];
    }
  } catch {}
  await K().set(key, val);
  try { window.dispatchEvent(new CustomEvent('dh:kv:changed', { detail: { key, val } })); } catch {}
}

export function canUndo(){ return undoStack.length > 0; }
export function canRedo(){ return redoStack.length > 0; }
export async function undoLast(){
  const e = undoStack.pop(); if (!e) return false;
  const cur = await K().get<any>(e.key);
  redoStack.push({ key: e.key, prev: cur, next: e.prev, ts: Date.now() });
  await K().set(e.key, e.prev);
  try { window.dispatchEvent(new CustomEvent('dh:kv:changed', { detail: { key: e.key, val: e.prev } })); } catch {}
  try { if (e.key.startsWith('tracker:')) window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: e.key.substring(8), filled: Number(e.prev||0) } })); } catch {}
  return true;
}
export async function redoLast(){
  const e = redoStack.pop(); if (!e) return false;
  const cur = await K().get<any>(e.key);
  // Redo should re-apply the value that was current before the undo (stored in e.prev)
  undoStack.push({ key: e.key, prev: cur, next: e.prev, ts: Date.now() });
  await K().set(e.key, e.prev);
  try { window.dispatchEvent(new CustomEvent('dh:kv:changed', { detail: { key: e.key, val: e.prev } })); } catch {}
  try { if (e.key.startsWith('tracker:')) window.dispatchEvent(new CustomEvent('dh:tracker:changed', { detail: { key: e.key.substring(8), filled: Number(e.prev||0) } })); } catch {}
  return true;
}

export async function getBoolArray(key: string, len: number): Promise<boolean[]>{
  const raw = await get<boolean[]>(key, []);
  const out = new Array(Math.max(0,len)).fill(false);
  for (let i=0;i<Math.min(out.length, Array.isArray(raw)? raw.length:0);i++) out[i] = !!(raw as any)[i];
  return out;
}
export async function setBoolArray(key: string, arr: boolean[]){ await set<boolean[]>(key, Array.isArray(arr)? arr.slice():[]); }
