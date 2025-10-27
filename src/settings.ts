// src/settings.ts
export interface DaggerheartSettings {
  stateFilePath: string;
  // Dashboard art defaults (can be overridden per-dashboard via YAML art: {...})
  artWidth?: string;       // e.g., "320px", "50%", "20rem"
  artMaxHeight?: string;   // e.g., "220px"
  artFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  artRadius?: string;      // e.g., "8px"
  artAlign?: 'left' | 'center' | 'right';
}

export const DEFAULT_SETTINGS: DaggerheartSettings = {
  stateFilePath: ".obsidian/plugins/dh_state.json",
  artWidth: "320px",
  artMaxHeight: "220px",
  artFit: 'contain',
  artRadius: '8px',
  artAlign: 'right',
};
