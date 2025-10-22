// src/lib/services/event-bus.ts

export interface ResetEvent {
  filePath: string;
  eventType: string; // e.g., 'short-rest', 'long-rest', 'custom'
  amount?: number;
}

type Topics = {
  reset: ResetEvent;                  // consumables reset_on rules
  "fm:changed": Record<string, any>;  // frontmatter updates
  "abilities:changed": void;

  // Tracker-specific events (file scoped)
  "hp:heal": { amount: number };
  "hp:clearAll": {};
  "stress:clear": { amount: number };
  "stress:clearAll": {};
  "armor:repair": { amount: number };
  "armor:clearAll": {};
  "hope:add": { amount: number };
};

export type TopicKeys = keyof Topics;
export type TopicPayload<K extends TopicKeys> = Topics[K];

type Callback<T> = (data: T) => void;

class EventBus<TMap extends Record<string, any>> {
  private subs: Record<string, Array<(data: any) => void>> = {};

  private scopedKey(scope: string, topic: string) {
    scope = scope.replace(/^\/+/, "").replace(/\\/g, "/");
    return `${scope}:${topic}`;
  }

  // ===== subscribe overloads =====
  subscribe<K extends keyof TMap>(scope: string, topic: K, cb: (data: TMap[K]) => void): () => void;
  subscribe(scope: string, topic: string, cb: (data: any) => void): () => void;
  subscribe(scope: string, topic: any, cb: (data: any) => void): () => void {
    const key = this.scopedKey(scope, String(topic));
    (this.subs[key] ||= []).push(cb);
    return () => this.unsubscribe(scope, topic, cb);
  }

  // ===== unsubscribe overloads =====
  unsubscribe<K extends keyof TMap>(scope: string, topic: K, cb: (data: TMap[K]) => void): void;
  unsubscribe(scope: string, topic: string, cb: (data: any) => void): void;
  unsubscribe(scope: string, topic: any, cb: (data: any) => void): void {
    const key = this.scopedKey(scope, String(topic));
    const arr = this.subs[key];
    if (!arr) return;
    this.subs[key] = arr.filter((fn) => fn !== cb);
    if (!this.subs[key].length) delete this.subs[key];
  }

  // ===== publish overloads =====
  publish<K extends keyof TMap>(scope: string, topic: K, payload: TMap[K]): void;
  publish(scope: string, topic: string, payload: any): void;
  publish(scope: string, topic: any, payload: any): void {
    const key = this.scopedKey(scope, String(topic));
    const arr = this.subs[key];
    if (!arr) return;
    for (const fn of arr) fn(payload);
  }

  clearScope(scope: string) {
    scope = scope.replace(/^\/+/, "").replace(/\\/g, "/");
    for (const k of Object.keys(this.subs)) {
      if (k.startsWith(scope + ":")) delete this.subs[k];
    }
  }
}

export const msgbus = new EventBus<Topics>();
