// src/lib/components/dashboard.ts
import type DaggerheartPlugin from "../../main";
import {
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  Notice,
  TFile,
} from "obsidian";
import yaml from "js-yaml";

/* =========================
   Small utils
   ========================= */
function asNum(v: unknown, def = 0): number {
  if (v === null || v === undefined) return def;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : def;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function getScope(el: HTMLElement): HTMLElement {
  return (el.closest(".markdown-preview-view") as HTMLElement) ?? document.body;
}
function readFM(plugin: DaggerheartPlugin, f: TFile) {
  return plugin.app.metadataCache.getFileCache(f)?.frontmatter ?? {};
}
function fmGetNum(fm: Record<string, any>, key: string, def = 0): number {
  return asNum(fm[key], def);
}
function fmGetNumAliases(
  fm: Record<string, any>,
  aliases: string[],
  def = NaN
): number {
  for (const k of aliases) if (fm[k] !== undefined) return asNum(fm[k], def);
  return def;
}
function pill(text: string, cls = "dh-rest-pill"): HTMLSpanElement {
  const s = document.createElement("span");
  s.className = cls;
  s.textContent = text;
  return s;
}
function btn(label: string, cls = "dh-rest-btn"): HTMLButtonElement {
  const b = document.createElement("button");
  b.className = cls;
  b.textContent = label;
  return b;
}
function eventBtn(label: string): HTMLButtonElement {
  return btn(label, "dh-event-btn");
}

/* =========================
   Tracker state (localStorage)
   ========================= */
function keyFor(k: string) {
  return `dh:tracker:${k}`;
}
function readFilled(k: string): number {
  try {
    const raw = localStorage.getItem(keyFor(k));
    return asNum(raw ? JSON.parse(raw) : 0, 0);
  } catch {
    return 0;
  }
}
function writeFilled(k: string, v: number) {
  try {
    localStorage.setItem(keyFor(k), JSON.stringify(v));
  } catch {}
}

/* =========================
   YAML shape for the dashboard
   ========================= */
type TrackerConf = {
  state_key?: string;
  uses?: number | string; // may be a number or "{{ frontmatter.x }}"
  label?: string; // optional row title
};
type DamageConf = {
  title?: string;
  hp_key?: string; // default din_health
  major_threshold?: number | string;
  severe_threshold?: number | string;
  base_major?: number | string;
  base_severe?: number | string;
  level?: number | string; // only used in base mode
};
type DashboardYaml = {
  hp?: TrackerConf;
  stress?: TrackerConf;
  armor?: TrackerConf;
  hope?: TrackerConf; // default to 6 if uses missing
  short_rest?: boolean | string; // true to render
  long_rest?: boolean | string; // true to render
  damage?: DamageConf | boolean; // true to render with defaults
};

function parseYaml(src: string): DashboardYaml {
  try {
    return (yaml.load(src) as DashboardYaml) ?? {};
  } catch {
    return {};
  }
}

/* Resolve "{{ frontmatter.xxx }}" or numbers */
function resolveUses(
  raw: number | string | undefined,
  fm: Record<string, any>,
  fallback = 0
): number {
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw === "number") return raw;
  const s = String(raw).trim();
  const m = s.match(/^\{\{\s*frontmatter\.([a-zA-Z0-9_\-]+)\s*\}\}$/);
  if (m) {
    const key = m[1];
    return asNum(fm[key], fallback);
  }
  return asNum(s, fallback);
}

/* =========================
   Tracker rendering
   ========================= */
function renderTrackerRow(
  host: HTMLElement,
  kind: "hp" | "stress" | "armor" | "hope",
  conf: TrackerConf,
  fm: Record<string, any>
) {
  const label = conf.label ?? kind.toUpperCase();
  const stateKey =
    conf.state_key ??
    (kind === "hp"
      ? "din_health"
      : kind === "stress"
      ? "din_stress"
      : kind === "armor"
      ? "din_armor"
      : "din_hope");

  const defaultUses = kind === "hope" ? 6 : 0;
  const total = resolveUses(conf.uses, fm, defaultUses);
  const filled = readFilled(stateKey);

  const row = host.createDiv({ cls: "dh-tracker" });
  row.createDiv({ cls: "dh-tracker-label", text: label });

  const boxes = row.createDiv({
    cls: `dh-tracker-boxes dh-track-rect dh-track-${kind}`,
  });

  const paint = (count: number) => {
    const nodes = boxes.querySelectorAll(".dh-track-box");
    nodes.forEach((n, i) =>
      (n as HTMLDivElement).classList.toggle("on", i < count)
    );
  };

  // Build boxes to match total
  boxes.empty();
  for (let i = 0; i < total; i++) {
    const b = document.createElement("div");
    b.className = "dh-track-box";
    b.dataset.idx = String(i);
    b.addEventListener("click", () => {
      // Fill up to clicked index (1-based)
      const next = i + 1;
      writeFilled(stateKey, next);
      paint(next);
    });
    boxes.appendChild(b);
  }
  paint(clamp(filled, 0, total));

  return {
    stateKey,
    getMax: () => boxes.querySelectorAll(".dh-track-box").length,
    repaint: () => paint(clamp(readFilled(stateKey), 0, total)),
    rebuildFromFM: (fm2: Record<string, any>) => {
      // when frontmatter changes, rebuild box count if needed
      const newTotal = resolveUses(conf.uses, fm2, defaultUses);
      if (newTotal !== boxes.querySelectorAll(".dh-track-box").length) {
        const prevFilled = clamp(readFilled(stateKey), 0, newTotal);
        boxes.empty();
        for (let i = 0; i < newTotal; i++) {
          const b = document.createElement("div");
          b.className = "dh-track-box";
          b.dataset.idx = String(i);
          b.addEventListener("click", () => {
            const next = i + 1;
            writeFilled(stateKey, next);
            paint(next);
          });
          boxes.appendChild(b);
        }
        paint(prevFilled);
      } else {
        // Same count; just repaint
        paint(clamp(readFilled(stateKey), 0, newTotal));
      }
    },
    paint,
    boxesEl: boxes,
  };
}

/* =========================
   Damage inline (tier-based reduction)
   ========================= */
function renderDamageInline(
  host: HTMLElement,
  plugin: DaggerheartPlugin,
  file: TFile,
  conf: DamageConf | true | undefined,
  hpTracker: ReturnType<typeof renderTrackerRow> | null
) {
  if (!conf) return;
  const cfg: DamageConf =
    conf === true ? ({ hp_key: "din_health" } as DamageConf) : conf;

  const hpKey = cfg.hp_key ?? "din_health";
  const wrap = host.createDiv({ cls: "dh-damage-inline" });
  wrap.createDiv({
    cls: "dh-rest-title",
    text: cfg.title ?? "Damage",
  });
  const sub = wrap.createDiv({ cls: "dh-rest-sub" });

  const row = wrap.createDiv({ cls: "dh-dmg-row" });
  const mkLabel = (t: string) => {
    const l = document.createElement("label");
    l.className = "dh-dmg-label";
    l.textContent = t;
    return l;
  };
  const dmg = document.createElement("input");
  dmg.type = "number";
  dmg.min = "0";
  dmg.value = "0";
  dmg.className = "dh-dmg-input";

  const red = document.createElement("input");
  red.type = "number";
  red.min = "0";
  red.value = "0";
  red.className = "dh-dmg-input";

  const dmgGroup = document.createElement("div");
  dmgGroup.className = "dh-dmg-group";
  dmgGroup.append(mkLabel("Damage"), dmg);

  const redGroup = document.createElement("div");
  redGroup.className = "dh-dmg-group";
  redGroup.append(mkLabel("Reduce by (tiers)"), red);

  const apply = eventBtn("Apply");

  row.append(dmgGroup, redGroup, apply);

  const resolveThresholds = () => {
    const fm = readFM(plugin, file);
    const fmMajor = fmGetNumAliases(fm, [
      "majorthreshold",
      "major_threshold",
      "majorThreshold",
      "major",
      "armor_major_threshold",
    ]);
    const fmSevere = fmGetNumAliases(fm, [
      "severethreshold",
      "severe_threshold",
      "severeThreshold",
      "severe",
      "armor_severe_threshold",
    ]);

    const finMajor =
      cfg.major_threshold !== undefined
        ? asNum(cfg.major_threshold, 0)
        : fmMajor;
    const finSevere =
      cfg.severe_threshold !== undefined
        ? asNum(cfg.severe_threshold, 0)
        : fmSevere;

    if (Number.isFinite(finMajor) && Number.isFinite(finSevere)) {
      sub.textContent = `Final Thresholds → Major: ${finMajor} • Severe: ${finSevere}`;
      return { major: finMajor, severe: finSevere };
    }

    // BASE fallback
    const level = fmGetNum(fm, "level", fmGetNum(fm, "tier", 0));
    const baseMajor = asNum(cfg.base_major, NaN);
    const baseSevere = asNum(cfg.base_severe, NaN);
    const finalMajor = asNum(baseMajor, 0) + asNum(cfg.level ?? level, 0);
    const finalSevere = asNum(baseSevere, 0) + asNum(cfg.level ?? level, 0);
    sub.textContent = `Thresholds → Major: ${finalMajor} • Severe: ${finalSevere} (base ${asNum(
      baseMajor,
      0
    )}/${asNum(baseSevere, 0)} + level ${asNum(cfg.level ?? level, 0)})`;
    return { major: finalMajor, severe: finalSevere };
  };

  const tierName = (t: number): "None" | "Minor" | "Major" | "Severe" =>
    t <= 0 ? "None" : t === 1 ? "Minor" : t === 2 ? "Major" : "Severe";

  // initial thresholds preview
  resolveThresholds();

  apply.onclick = () => {
    const { major, severe } = resolveThresholds();
    if (!Number.isFinite(major) || !Number.isFinite(severe)) {
      new Notice(
        "Damage: thresholds not found. Add majorthreshold/severethreshold to frontmatter, or base_major/base_severe in the block.",
        6000
      );
      return;
    }
    const amt = asNum(dmg.value, 0);
    const reduceTiers = Math.max(0, Math.floor(asNum(red.value, 0)));

    let startTier = 0;
    if (amt >= severe) startTier = 3;
    else if (amt >= major) startTier = 2;
    else if (amt > 0) startTier = 1;

    const endTier = clamp(startTier - reduceTiers, 0, 3);

    const scope = getScope(host);
    const hpMax = hpTracker?.getMax() ?? 0;

    let hpFilled = readFilled(hpKey);
    hpFilled = clamp(hpFilled + endTier, 0, hpMax || 999);
    writeFilled(hpKey, hpFilled);
    hpTracker?.repaint();

    new Notice(
      `Damage ${amt} — Severity: ${tierName(startTier)} → ${tierName(
        endTier
      )} (reduced by ${reduceTiers}) — Now HP on: ${hpFilled}${
        hpMax ? `/${hpMax}` : ""
      }`,
      7000
    );
  };

  // live-update thresholds line when FM changes
  const child = new MarkdownRenderChild(host);
  child.registerEvent(
    plugin.app.metadataCache.on("changed", (changed) => {
      if (changed.path === file.path) resolveThresholds();
    })
  );
  child.registerEvent(
    plugin.app.metadataCache.on("resolved", () => resolveThresholds())
  );
}

/* =========================
   Short Rest (same rules you set)
   ========================= */
function openShortRestModal(
  host: HTMLElement,
  plugin: DaggerheartPlugin,
  file: TFile,
  keys: { hp: string; stress: string; armor: string; hope: string },
  trackers: {
    hp: ReturnType<typeof renderTrackerRow> | null;
    stress: ReturnType<typeof renderTrackerRow> | null;
    armor: ReturnType<typeof renderTrackerRow> | null;
    hope: ReturnType<typeof renderTrackerRow> | null;
  }
) {
  const fm = readFM(plugin, file);
  const tier = asNum(fm.tier ?? fm.level ?? 1, 1);

  const modal = document.createElement("div");
  modal.className = "dh-rest-modal";
  const backdrop = document.createElement("div");
  backdrop.className = "dh-rest-backdrop";
  modal.appendChild(backdrop);

  const panel = document.createElement("div");
  panel.className = "dh-rest-chooser";
  modal.appendChild(panel);

  const head = panel.createDiv({ cls: "dh-rest-headerbar" });
  const titleWrap = head.createDiv({ cls: "dh-rest-titlewrap" });
  titleWrap.createDiv({ cls: "dh-rest-title", text: "Short Rest" });
  titleWrap.createDiv({
    cls: "dh-rest-sub",
    text: "Choose exactly two moves (you may pick the same move twice).",
  });

  const party = head.createDiv({ cls: "dh-rest-party" });
  party.append(pill(`Tier ${tier}`));

  const picks = head.createDiv({ cls: "dh-rest-picks" });
  picks.setText("Selected: 0/2");

  const closeBtn = head.createEl("button", { cls: "dh-rest-close", text: "×" });

  const actions = panel.createDiv({ cls: "dh-rest-actions" });

  const CHOICES = [
    { key: "heal", label: "Tend to Wounds (1d4 + tier HP)" },
    { key: "stress", label: "Clear Stress (1d4 + tier)" },
    { key: "armor", label: "Repair Armor (1d4 + tier)" },
    { key: "prepare", label: "Prepare (+1 Hope)" },
    { key: "prepare_party", label: "Prepare with Party (+2 Hope)" },
  ] as const;

  const counts: Record<string, number> = Object.fromEntries(
    CHOICES.map((c) => [c.key, 0])
  );
  const selected = () =>
    Object.values(counts).reduce((a, b) => a + b, 0);
  const setPicks = () =>
    (picks.textContent = `Selected: ${selected()}/2`);

  const btns: Record<string, HTMLButtonElement> = {};
  const labelWithCount = (label: string, count: number) =>
    count === 0 ? label : `${label} ×${count}`;

  for (const c of CHOICES) {
    const b = btn(c.label);
    btns[c.key] = b;
    const update = () => {
      const ct = counts[c.key];
      b.textContent = labelWithCount(c.label, ct);
      b.classList.toggle("on", ct > 0);
    };
    update();

    b.onclick = () => {
      // mutual exclusion: prepare vs prepare_party
      if (c.key === "prepare" && counts["prepare_party"] > 0) {
        counts["prepare_party"] = 0;
        btns["prepare_party"].textContent = CHOICES.find(
          (x) => x.key === "prepare_party"
        )!.label;
        btns["prepare_party"].classList.remove("on");
      }
      if (c.key === "prepare_party" && counts["prepare"] > 0) {
        counts["prepare"] = 0;
        btns["prepare"].textContent = CHOICES.find(
          (x) => x.key === "prepare"
        )!.label;
        btns["prepare"].classList.remove("on");
      }

      // 0→1→2→0 cycling, but total cannot exceed 2
      const cur = counts[c.key];
      const next = (cur + 1) % 3;
      const delta = next - cur;
      if (delta > 0 && selected() + delta > 2) {
        new Notice("Select exactly two total moves.");
        return;
      }
      counts[c.key] = next;
      update();
      setPicks();
    };

    actions.appendChild(b);
  }
  setPicks();

  const applyRow = panel.createDiv({ cls: "dh-rest-apply" });
  const apply = eventBtn("Apply Short Rest");
  applyRow.appendChild(apply);

  const close = () => {
    if (modal.parentElement) document.body.removeChild(modal);
    window.removeEventListener("keydown", onKey);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  backdrop.onclick = close;
  closeBtn.onclick = close;
  window.addEventListener("keydown", onKey);

  apply.onclick = () => {
    if (selected() !== 2) {
      new Notice("Select exactly two total moves.");
      return;
    }
    // Roll helper
    const roll1d4 = () => Math.floor(Math.random() * 4) + 1;
    const lines: string[] = [];

    // current values
    const hpMax = trackers.hp?.getMax() ?? 0;
    const stressMax = trackers.stress?.getMax() ?? 0;
    const armorMax = trackers.armor?.getMax() ?? 0;
    const hopeMax = trackers.hope?.getMax() ?? 0;

    let hpFilled = readFilled(keys.hp);
    let stressFilled = readFilled(keys.stress);
    let armorFilled = readFilled(keys.armor);
    let hopeFilled = readFilled(keys.hope);

    const applyHeal = () => {
      const r = roll1d4() + tier;
      const before = hpFilled;
      hpFilled = clamp(hpFilled - r, 0, hpMax || 999);
      lines.push(`Tend to Wounds: 1d4(${r - tier}) + ${tier} = ${r}; HP ${before} → ${hpFilled}`);
    };
    const applyStress = () => {
      const r = roll1d4() + tier;
      const before = stressFilled;
      stressFilled = clamp(stressFilled - r, 0, stressMax || 999);
      lines.push(`Clear Stress: 1d4(${r - tier}) + ${tier} = ${r}; Stress ${before} → ${stressFilled}`);
    };
    const applyArmor = () => {
      const r = roll1d4() + tier;
      const before = armorFilled;
      armorFilled = clamp(armorFilled - r, 0, armorMax || 999);
      lines.push(`Repair Armor: 1d4(${r - tier}) + ${tier} = ${r}; Armor ${before} → ${armorFilled}`);
    };
    const applyPrepare = () => {
      const before = hopeFilled;
      hopeFilled = clamp(hopeFilled + 1, 0, hopeMax || 999);
      lines.push(`Prepare: +1 Hope; Hope ${before} → ${hopeFilled}`);
    };
    const applyPrepareParty = () => {
      const before = hopeFilled;
      hopeFilled = clamp(hopeFilled + 2, 0, hopeMax || 999);
      lines.push(`Prepare with Party: +2 Hope; Hope ${before} → ${hopeFilled}`);
    };

    // apply by count (respect duplicates)
    for (let i = 0; i < counts["heal"]; i++) applyHeal();
    for (let i = 0; i < counts["stress"]; i++) applyStress();
    for (let i = 0; i < counts["armor"]; i++) applyArmor();
    for (let i = 0; i < counts["prepare"]; i++) applyPrepare();
    for (let i = 0; i < counts["prepare_party"]; i++) applyPrepareParty();

    // persist + repaint
    writeFilled(keys.hp, hpFilled);
    writeFilled(keys.stress, stressFilled);
    writeFilled(keys.armor, armorFilled);
    writeFilled(keys.hope, hopeFilled);

    trackers.hp?.repaint();
    trackers.stress?.repaint();
    trackers.armor?.repaint();
    trackers.hope?.repaint();

    new Notice(lines.join(" • "), 8000);
    close();
  };

  document.body.appendChild(modal);
}

/* =========================
   Long Rest (your final rules)
   ========================= */
function openLongRestModal(
  host: HTMLElement,
  plugin: DaggerheartPlugin,
  file: TFile,
  keys: { hp: string; stress: string; armor: string; hope: string },
  trackers: {
    hp: ReturnType<typeof renderTrackerRow> | null;
    stress: ReturnType<typeof renderTrackerRow> | null;
    armor: ReturnType<typeof renderTrackerRow> | null;
    hope: ReturnType<typeof renderTrackerRow> | null;
  }
) {
  const modal = document.createElement("div");
  modal.className = "dh-rest-modal";
  const backdrop = document.createElement("div");
  backdrop.className = "dh-rest-backdrop";
  modal.appendChild(backdrop);

  const panel = document.createElement("div");
  panel.className = "dh-rest-chooser";
  modal.appendChild(panel);

  const head = panel.createDiv({ cls: "dh-rest-headerbar" });
  const titleWrap = head.createDiv({ cls: "dh-rest-titlewrap" });
  titleWrap.createDiv({ cls: "dh-rest-title", text: "Long Rest" });
  titleWrap.createDiv({
    cls: "dh-rest-sub",
    text: "Choose exactly two moves (you may choose the same move twice).",
  });

  head.createDiv({ cls: "dh-rest-party" }).append(pill("Camped & Rested"));
  const picks = head.createDiv({ cls: "dh-rest-picks" });
  picks.setText("Selected: 0/2");

  const closeBtn = head.createEl("button", { cls: "dh-rest-close", text: "×" });

  const actions = panel.createDiv({ cls: "dh-rest-actions" });

  const CHOICES = [
    { key: "heal_all", label: "Tend to All Wounds (Clear ALL HP)" },
    { key: "stress_all", label: "Clear All Stress" },
    { key: "armor_all", label: "Repair All Armor" },
    { key: "prepare", label: "Prepare (+1 Hope)" },
    { key: "prepare_party", label: "Prepare with Party (+2 Hope)" },
    { key: "project", label: "Work on a Project" },
  ] as const;

  const counts: Record<string, number> = Object.fromEntries(
    CHOICES.map((c) => [c.key, 0])
  );
  const selected = () =>
    Object.values(counts).reduce((a, b) => a + b, 0);
  const setPicks = () =>
    (picks.textContent = `Selected: ${selected()}/2`);

  const btns: Record<string, HTMLButtonElement> = {};
  const labelWithCount = (label: string, count: number) =>
    count === 0 ? label : `${label} ×${count}`;

  for (const c of CHOICES) {
    const b = btn(c.label);
    btns[c.key] = b;
    const update = () => {
      const ct = counts[c.key];
      b.textContent = labelWithCount(c.label, ct);
      b.classList.toggle("on", ct > 0);
    };
    update();

    b.onclick = () => {
      // mutual exclusion: prepare vs prepare_party
      if (c.key === "prepare" && counts["prepare_party"] > 0) {
        counts["prepare_party"] = 0;
        btns["prepare_party"].textContent = CHOICES.find(
          (x) => x.key === "prepare_party"
        )!.label;
        btns["prepare_party"].classList.remove("on");
      }
      if (c.key === "prepare_party" && counts["prepare"] > 0) {
        counts["prepare"] = 0;
        btns["prepare"].textContent = CHOICES.find(
          (x) => x.key === "prepare"
        )!.label;
        btns["prepare"].classList.remove("on");
      }

      const cur = counts[c.key];
      const next = (cur + 1) % 3;
      const delta = next - cur;
      if (delta > 0 && selected() + delta > 2) {
        new Notice("Select exactly two total moves.");
        return;
      }
      counts[c.key] = next;
      update();
      setPicks();
    };

    actions.appendChild(b);
  }
  setPicks();

  const applyRow = panel.createDiv({ cls: "dh-rest-apply" });
  const apply = eventBtn("Apply Long Rest");
  applyRow.appendChild(apply);

  const close = () => {
    if (modal.parentElement) document.body.removeChild(modal);
    window.removeEventListener("keydown", onKey);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  backdrop.onclick = close;
  closeBtn.onclick = close;
  window.addEventListener("keydown", onKey);

  const hpMax = trackers.hp?.getMax() ?? 0;
  const stressMax = trackers.stress?.getMax() ?? 0;
  const armorMax = trackers.armor?.getMax() ?? 0;
  const hopeMax = trackers.hope?.getMax() ?? 0;

  apply.onclick = () => {
    if (selected() !== 2) {
      new Notice("Select exactly two total moves.");
      return;
    }

    let hpFilled = readFilled(keys.hp);
    let stressFilled = readFilled(keys.stress);
    let armorFilled = readFilled(keys.armor);
    let hopeFilled = readFilled(keys.hope);

    const lines: string[] = [];

    for (let i = 0; i < counts["heal_all"]; i++) {
      hpFilled = 0;
      lines.push("Tend to All Wounds: HP fully restored.");
    }
    for (let i = 0; i < counts["stress_all"]; i++) {
      stressFilled = 0;
      lines.push("Clear All Stress: Stress fully cleared.");
    }
    for (let i = 0; i < counts["armor_all"]; i++) {
      armorFilled = 0;
      lines.push("Repair All Armor: Armor fully repaired.");
    }
    for (let i = 0; i < counts["prepare"]; i++) {
      hopeFilled = clamp(hopeFilled + 1, 0, hopeMax || 999);
      lines.push("Prepare: +1 Hope.");
    }
    for (let i = 0; i < counts["prepare_party"]; i++) {
      hopeFilled = clamp(hopeFilled + 2, 0, hopeMax || 999);
      lines.push("Prepare with Party: +2 Hope.");
    }
    for (let i = 0; i < counts["project"]; i++) {
      lines.push("Work on a Project: progress recorded.");
    }

    writeFilled(keys.hp, hpFilled);
    writeFilled(keys.stress, stressFilled);
    writeFilled(keys.armor, armorFilled);
    writeFilled(keys.hope, hopeFilled);

    trackers.hp?.repaint();
    trackers.stress?.repaint();
    trackers.armor?.repaint();
    trackers.hope?.repaint();

    new Notice(lines.join(" • "), 8000);
    close();
  };

  document.body.appendChild(modal);
}

/* =========================
   Public: register one combined block
   ========================= */
export function registerDashboard(plugin: DaggerheartPlugin) {
  plugin.registerMarkdownCodeBlockProcessor(
    "dh-ui",
    async (src: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      el.empty();

      const file = plugin.app.vault.getFileByPath(ctx.sourcePath);
      if (!file) {
        el.createEl("pre", { text: "DH-UI: could not resolve file." });
        return;
      }

      const conf = parseYaml(src);

      // Shell
      const wrap = el.createDiv({ cls: "dh-dashboard" });

      // --- TRACKERS ---
      const trackersWrap = wrap.createDiv({ cls: "dh-dashboard-section" });
      const trackersTitle = trackersWrap.createDiv({
        cls: "dh-rest-title",
        text: "Trackers",
      });

      const rows = trackersWrap.createDiv({ cls: "dh-trackers" });

      const fm = readFM(plugin, file);

      const hpTrack = conf.hp
        ? renderTrackerRow(rows, "hp", conf.hp, fm)
        : null;
      const stressTrack = conf.stress
        ? renderTrackerRow(rows, "stress", conf.stress, fm)
        : null;
      const armorTrack = conf.armor
        ? renderTrackerRow(rows, "armor", conf.armor, fm)
        : null;
      const hopeTrack = conf.hope
        ? renderTrackerRow(rows, "hope", conf.hope, fm)
        : null;

      // --- REST BUTTONS (open modals) ---
      const restWrap = wrap.createDiv({ cls: "dh-dashboard-section" });
      restWrap.createDiv({ cls: "dh-rest-title", text: "Rests" });
      const restRow = restWrap.createDiv({ cls: "dh-event-btns" });

      if (conf.short_rest !== false && conf.short_rest !== "false") {
        const sr = btn("Short Rest");
        sr.onclick = () =>
          openShortRestModal(el, plugin, file, {
            hp: conf.hp?.state_key ?? "din_health",
            stress: conf.stress?.state_key ?? "din_stress",
            armor: conf.armor?.state_key ?? "din_armor",
            hope: conf.hope?.state_key ?? "din_hope",
          }, {
            hp: hpTrack,
            stress: stressTrack,
            armor: armorTrack,
            hope: hopeTrack,
          });
        restRow.appendChild(sr);
      }

      if (conf.long_rest !== false && conf.long_rest !== "false") {
        const lr = btn("Long Rest");
        lr.onclick = () =>
          openLongRestModal(el, plugin, file, {
            hp: conf.hp?.state_key ?? "din_health",
            stress: conf.stress?.state_key ?? "din_stress",
            armor: conf.armor?.state_key ?? "din_armor",
            hope: conf.hope?.state_key ?? "din_hope",
          }, {
            hp: hpTrack,
            stress: stressTrack,
            armor: armorTrack,
            hope: hopeTrack,
          });
        restRow.appendChild(lr);
      }

      // --- DAMAGE INLINE ---
      const dmgWrap = wrap.createDiv({ cls: "dh-dashboard-section" });
      renderDamageInline(
        dmgWrap,
        plugin,
        file,
        conf.damage === undefined ? true : conf.damage,
        hpTrack
      );

      // Live update trackers when frontmatter changes
      const child = new MarkdownRenderChild(el);
      child.registerEvent(
        plugin.app.metadataCache.on("changed", (changed) => {
          if (changed.path !== file.path) return;
          const newFM = readFM(plugin, file);
          hpTrack?.rebuildFromFM(newFM);
          stressTrack?.rebuildFromFM(newFM);
          armorTrack?.rebuildFromFM(newFM);
          hopeTrack?.rebuildFromFM(newFM);
        })
      );
      child.registerEvent(
        plugin.app.metadataCache.on("resolved", () => {
          const newFM = readFM(plugin, file);
          hpTrack?.rebuildFromFM(newFM);
          stressTrack?.rebuildFromFM(newFM);
          armorTrack?.rebuildFromFM(newFM);
          hopeTrack?.rebuildFromFM(newFM);
        })
      );
      ctx.addChild(child);
    }
  );
}
