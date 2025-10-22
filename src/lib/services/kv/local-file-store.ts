import type { Vault } from "obsidian";
import type { DataStore } from "./kv";

export class JsonDataStore implements DataStore {
  constructor(private vault: Vault, private filePath: string) {}
  async loadData(): Promise<any> {
    try{
      const exists = await this.vault.adapter.exists(this.filePath);
      if (!exists){
        await this.vault.adapter.write(this.filePath, JSON.stringify({}, null, 2));
        return {};
      }
      const data = await this.vault.adapter.read(this.filePath);
      return JSON.parse(data);
    }catch(e){
      console.error("[DH-UI] KV load error", e);
      return {};
    }
  }
  async saveData(data: any): Promise<void> {
    await this.vault.adapter.write(this.filePath, JSON.stringify(data, null, 2));
  }
}
