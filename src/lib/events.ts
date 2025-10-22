// File-scoped event buses + a registry so rest moves can find trackers in the same file.

export type DHEventDetail = { type: string };

const buses = new Map<string, EventTarget>();

export function getEventBus(filePath: string): EventTarget {
  let bus = buses.get(filePath);
  if (!bus) {
    bus = new EventTarget();
    buses.set(filePath, bus);
  }
  return bus;
}

export function dispatchFileEvent(filePath: string, type: string) {
  const bus = getEventBus(filePath);
  bus.dispatchEvent(new CustomEvent<DHEventDetail>("dh:event", { detail: { type } }));
}

// Listen; returns an unlisten function
export function onFileEvent(
  filePath: string,
  handler: (type: string) => void
): () => void {
  const bus = getEventBus(filePath);
  const fn = (e: Event) => {
    const ev = e as CustomEvent<DHEventDetail>;
    handler(ev.detail?.type ?? "");
  };
  bus.addEventListener("dh:event", fn);
  return () => bus.removeEventListener("dh:event", fn);
}

/* ========= Tracker Registry (per file) ========= */

export type TrackerKind = "hp" | "stress" | "hope" | "armor";

export interface TrackerRef {
  kind: TrackerKind;
  stateKey: string;
  get(): Promise<boolean[]>;                 // returns boolean array (true = filled/used)
  set(next: boolean[]): Promise<void>;       // persist array
  getCount(): number;                        // length of meter
}

const fileRegistry = new Map<string, Map<string, TrackerRef[]>>();
// Map<filePath, Map<kind, TrackerRef[]>>

export function registerTrackerRef(filePath: string, ref: TrackerRef) {
  let byKind = fileRegistry.get(filePath);
  if (!byKind) {
    byKind = new Map();
    fileRegistry.set(filePath, byKind);
  }
  const list = byKind.get(ref.kind) ?? [];
  list.push(ref);
  byKind.set(ref.kind, list);
}

export function getTrackers(filePath: string, kind: TrackerKind): TrackerRef[] {
  const byKind = fileRegistry.get(filePath);
  if (!byKind) return [];
  return byKind.get(kind) ?? [];
}
