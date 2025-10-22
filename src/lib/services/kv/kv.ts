export interface DataStore {
  loadData(): Promise<any>;
  saveData(data: any): Promise<void>;
}
export class KeyValueStore {
  private store: DataStore;
  private cache: Record<string, any> | null = null;
  constructor(store: DataStore){ this.store = store; }
  private async ensure(): Promise<Record<string, any>>{
    if (this.cache === null){
      const data = await this.store.loadData();
      this.cache = data?.state || {};
    }
    // @ts-expect-error
    return this.cache;
  }
  private async persist(){ if (this.cache !== null) await this.store.saveData({ state: this.cache }); }
  async get<T>(k: string){ const c = await this.ensure(); return c[k] as T | undefined; }
  async set<T>(k: string, v: T){ const c = await this.ensure(); c[k] = v; await this.persist(); }
  async has(k: string){ const c = await this.ensure(); return k in c; }
  async delete(k: string){ const c = await this.ensure(); if (k in c){ delete c[k]; await this.persist(); return true; } return false; }
  async clear(){ this.cache = {}; await this.persist(); }
  async keys(){ const c = await this.ensure(); return Object.keys(c); }
  async values<T>(){ const c = await this.ensure(); return Object.values(c) as T[]; }
  async entries<T>(){ const c = await this.ensure(); return Object.entries(c) as [string,T][]; }
}
