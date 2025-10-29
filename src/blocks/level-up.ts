// src/blocks/level-up.ts
import type DaggerheartPlugin from "../main";
import { MarkdownPostProcessorContext, MarkdownRenderChild, Notice, TFile } from "obsidian";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { RestButtonView } from "../components/rest-button";

const roots = new WeakMap<HTMLElement, Root>();

// Limits for Tier 2 (Levels 2–4)
const T2_LIMITS = {
  opt1: 3, // +1 to two unmarked traits
  opt2: 2, // +1 HP slot
  opt3: 2, // +1 Stress slot
  opt4: 1, // +1 to two experiences (stub)
  opt5: 999, // shown as reminder (no counter used in T2)
  opt6: 1, // +1 Evasion
} as const;

// Limits for Tier 3 (Levels 5–7)
const T3_LIMITS = {
  opt1: 3,
  opt2: 2,
  opt3: 2,
  opt4: 1,
  opt5: 1, // domain card up to level 7
  opt6: 1,
  opt7: 2, // +1 proficiency
  opt8: 2, // multiclass reminder/cross-outs
} as const;

// Limits for Tier 4 (Levels 8–10)
const T4_LIMITS = {
  opt1: 3,
  opt2: 2,
  opt3: 2,
  opt4: 1,
  opt5: 1,
  opt6: 1,
  opt7: 2,
  opt8: 2,
  opt9: 1, // upgraded subclass card
} as const;

function ensure(obj: any, path: string[], init: any){
  let cur = obj;
  for (let i=0;i<path.length;i++){
    const k = path[i];
    if (i === path.length-1){ if (cur[k] == null) cur[k] = (typeof init === 'function'? init(): Array.isArray(init)? [...init]: (typeof init==='object'? {...init}: init)); return cur[k]; }
    if (cur[k] == null) cur[k] = {};
    cur = cur[k];
  }
  return cur;
}

function btn(label: string, cls = 'dh-rest-btn'){ const b = document.createElement('button'); b.className = cls; b.textContent = label; return b; }
function pill(text: string, cls = 'dh-rest-pill'){ const s = document.createElement('span'); s.className = cls; s.textContent = text; return s; }


export function renderInlineLevelUp(plugin: DaggerheartPlugin, el: HTMLElement, ctx: MarkdownPostProcessorContext, embedded = false){
  const file = plugin.app.vault.getFileByPath(ctx.sourcePath) || plugin.app.workspace.getActiveFile();
  if (!file) { el.createEl('pre', { text: 'Level Up: could not resolve file' }); return; }
  const fm = plugin.app.metadataCache.getFileCache(file as TFile)?.frontmatter ?? {};
  const curLevel = Number(fm.level ?? 1);
  const nextLevelPreview = curLevel + 1;
  const tierKey = (nextLevelPreview >= 5 && nextLevelPreview <= 7) ? 't3' : 't2';
  const LIMITS: any = (tierKey==='t3') ? T3_LIMITS : T2_LIMITS;

  // compute uses left
  const usedPath = (fm as any)?.dh_levelup?.[tierKey] ?? {} as any;
  const used = (k: string) => Number(usedPath[k] ?? 0);
  const remain = (k: string) => Math.max(0, Number((LIMITS as any)[k] ?? 0) - used(k));

  // container
  el.addClass('dh-levelup');
  let body: HTMLElement;
  if (embedded) {
    // In embedded mode (dashboard), do not render an inner header/button.
    // Render directly into the host, which already handles show/hide.
    if (!el.classList.contains('dh-levelup-body')) el.addClass('dh-levelup-body');
    // Respect host hidden state; dashboard button controls visibility
    body = el;
  } else {
    const header = el.createDiv({ cls: 'dh-levelup-header' });
    const toggleBtn = header.createEl('button', { cls: 'dh-event-btn', text: 'Level Up' });
    body = el.createDiv({ cls: 'dh-levelup-body hidden' });
    toggleBtn.onclick = () => {
      if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        toggleBtn.innerText = 'Hide';
      } else {
        body.classList.add('hidden');
        toggleBtn.innerText = 'Level Up';
      }
    };
  }
  const grid = body.createDiv({ cls: 'dh-levelup-grid' });
  // Column 1: Tier 2
  const col1 = grid.createDiv({ cls: 'dh-levelup-col' });
  col1.createDiv({ cls: 'dh-levelup-title', text: 'TIER 2: LEVELS 2–4' });
  col1.createDiv({ cls: 'dh-levelup-note', text: 'At level 2, gain +1 Proficiency and Experience +2. Choose two options below.' });
  const list2 = col1.createDiv({ cls: 'dh-levelup-list' });

  // Column 2: Tier 3
  const col2 = grid.createDiv({ cls: 'dh-levelup-col' });
  col2.createDiv({ cls: 'dh-levelup-title', text: 'TIER 3: LEVELS 5–7' });
  col2.createDiv({ cls: 'dh-levelup-note', text: 'At level 5, gain +1 Proficiency. Clear all trait toggles. Choose two options below.' });
  const list3 = col2.createDiv({ cls: 'dh-levelup-list' });

  // Column 3: Tier 4
  const col3 = grid.createDiv({ cls: 'dh-levelup-col' });
  col3.createDiv({ cls: 'dh-levelup-title', text: 'TIER 4: LEVELS 8–10' });
  col3.createDiv({ cls: 'dh-levelup-note', text: 'At level 8, gain Experience +2 and clear all marks on traits, then +1 Proficiency. Choose two options below.' });
  const list4 = col3.createDiv({ cls: 'dh-levelup-list' });

  // utilities
  const used2 = (fm as any)?.dh_levelup?.t2 ?? {} as any; const used3 = (fm as any)?.dh_levelup?.t3 ?? {} as any; const used4 = (fm as any)?.dh_levelup?.t4 ?? {} as any;
  const remain2 = (id:string)=> Math.max(0, Number((T2_LIMITS as any)[id] ?? 0) - Number(used2[id] ?? 0));
  const remain3 = (id:string)=> Math.max(0, Number((T3_LIMITS as any)[id] ?? 0) - Number(used3[id] ?? 0));
  const remain4 = (id:string)=> Math.max(0, Number((T4_LIMITS as any)[id] ?? 0) - Number(used4[id] ?? 0));

  const boxes: Array<{el: HTMLInputElement; tier: 't2'|'t3'|'t4'; id: string}> = [];
  const picksByTier: Record<'t2'|'t3'|'t4', Set<string>> = { t2: new Set<string>(), t3: new Set<string>(), t4: new Set<string>() } as any;
  const markedT2: string[] = Array.isArray((fm as any)?.dh_marked_traits) ? (fm as any).dh_marked_traits : [];
  const markedT3: string[] = Array.isArray((fm as any)?.dh_levelup?.t3?.marked_traits) ? (fm as any).dh_levelup.t3.marked_traits : [];
  const markedT4: string[] = Array.isArray((fm as any)?.dh_levelup?.t4?.marked_traits) ? (fm as any).dh_levelup.t4.marked_traits : [];

  const mkTraitPicker = (parent: HTMLElement, tier: 't2'|'t3'|'t4', enabled: boolean) => {
    const marked = tier==='t2'? markedT2 : tier==='t3'? markedT3 : markedT4;
    const wrap = parent.createDiv({ cls: 'dh-levelup-subpanel' });
    const traits = ['Agility','Strength','Finesse','Instinct','Presence','Knowledge'];
    traits.forEach(name => {
      const lab = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset['trait'] = name;
      // disabled if already marked for this tier, else depends on opt1 checkbox state (enabled param)
      cb.disabled = marked.includes(name) || !enabled;
      cb.onchange = () => {
        if (cb.checked) {
          if (picksByTier[tier].size >= 2) { cb.checked = false; return; }
          picksByTier[tier].add(name);
        } else {
          picksByTier[tier].delete(name);
        }
      };
      if (marked.includes(name)) lab.classList.add('marked');
      lab.appendChild(cb); lab.appendChild(document.createTextNode(name + (marked.includes(name)? ' (marked)':'')));
      wrap.appendChild(lab);
    });
    parent.createDiv({ cls: 'dh-levelup-subnote', text: 'Pick exactly two traits for this option.' });
    return wrap;
  };

  const mkRow = (parent: HTMLElement, tier: 't2'|'t3'|'t4', id: string, label: string, totalLimit: number, usedCount: number, dupCount = 1) => {
    const available = usedCount < totalLimit;
    const row = parent.createDiv({ cls: 'dh-levelup-row' + (available? '' : ' disabled') });
    // usage boxes
    const uses = row.createDiv({ cls: 'dh-lu-uses' });
    for (let i=0;i<totalLimit;i++){ const b = document.createElement('div'); b.className = 'box' + (i<usedCount?' on':''); uses.appendChild(b); }
    // selection checkboxes (dupCount)
    const remain = Math.max(0, totalLimit - usedCount);
    const actives = Math.min(dupCount, remain);
    for (let i=0;i<dupCount;i++){
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.disabled = i >= actives; cb.dataset['opt'] = id + '/' + (i+1); cb.dataset['tier']=tier; row.appendChild(cb);
      boxes.push({ el: cb, tier, id: id + '/' + (i+1) });
    }
    const span = document.createElement('span'); span.className='label'; span.textContent = label; row.appendChild(span);
    if (!available) { try { span.classList.add('disabled'); } catch {} }
    // attach picker for opt1 (use first checkbox as controller)
    if (id==='opt1') {
      const picker = mkTraitPicker(parent, tier, available);
      const controller = boxes[boxes.length - dupCount]; // first of the added cbs for this row
      const setEnabled = (en:boolean)=>{
        const markedArr = tier==='t2'? markedT2 : tier==='t3'? markedT3 : markedT4;
        Array.from(picker.querySelectorAll('input[type="checkbox"]') as any).forEach((n:HTMLInputElement)=>{
          const trait = String(n.dataset['trait']||'');
          const isMarked = markedArr.includes(trait);
          n.disabled = isMarked || !en;
        });
      };
      controller.el.onchange = ()=> setEnabled((controller.el as HTMLInputElement).checked && !(controller.el as HTMLInputElement).disabled);
      setEnabled(false);
    }
  };

  // Tier 2 options
  mkRow(list2, 't2', 'opt1', 'Gain a +1 bonus to two unmarked character traits and mark them.', (T2_LIMITS as any).opt1, (used2 as any).opt1||0);
  mkRow(list2, 't2', 'opt2', 'Permanently gain one Hit Point slot.', (T2_LIMITS as any).opt2, (used2 as any).opt2||0, 2);
  mkRow(list2, 't2', 'opt3', 'Permanently gain one Stress slot.', (T2_LIMITS as any).opt3, (used2 as any).opt3||0, 2);
  mkRow(list2, 't2', 'opt4', 'Permanently gain a +1 bonus to two Experiences.', (T2_LIMITS as any).opt4, (used2 as any).opt4||0);
  mkRow(list2, 't2', 'opt5', 'Choose an additional domain card (up to level 4).', (T2_LIMITS as any).opt5||0, (used2 as any).opt5||0);
  mkRow(list2, 't2', 'opt6', 'Permanently gain a +1 bonus to your Evasion.', (T2_LIMITS as any).opt6, (used2 as any).opt6||0);

  // Tier 3 options
  mkRow(list3, 't3', 'opt1', 'Gain a +1 bonus to two unmarked character traits and mark them.', (T3_LIMITS as any).opt1, (used3 as any).opt1||0);
  mkRow(list3, 't3', 'opt2', 'Permanently gain one Hit Point slot.', (T3_LIMITS as any).opt2, (used3 as any).opt2||0, 2);
  mkRow(list3, 't3', 'opt3', 'Permanently gain one Stress slot.', (T3_LIMITS as any).opt3, (used3 as any).opt3||0, 2);
  mkRow(list3, 't3', 'opt4', 'Permanently gain a +1 bonus to two Experiences.', (T3_LIMITS as any).opt4, (used3 as any).opt4||0);
  mkRow(list3, 't3', 'opt5', 'Choose an additional domain card (up to level 7).', (T3_LIMITS as any).opt5, (used3 as any).opt5||0);
  mkRow(list3, 't3', 'opt6', 'Permanently gain a +1 bonus to your Evasion.', (T3_LIMITS as any).opt6, (used3 as any).opt6||0);
  mkRow(list3, 't3', 'opt7', 'Increase your proficiency by +1.', (T3_LIMITS as any).opt7, (used3 as any).opt7||0, 2);
  mkRow(list3, 't3', 'opt8', 'Multiclass (see sheet for details).', (T3_LIMITS as any).opt8, (used3 as any).opt8||0, 2);

  // Tier 4 options
  mkRow(list4, 't4', 'opt1', 'Gain a +1 bonus to two unmarked character traits and mark them.', (T4_LIMITS as any).opt1, (used4 as any).opt1||0);
  mkRow(list4, 't4', 'opt2', 'Permanently gain one Hit Point slot.', (T4_LIMITS as any).opt2, (used4 as any).opt2||0, 2);
  mkRow(list4, 't4', 'opt3', 'Permanently gain one Stress slot.', (T4_LIMITS as any).opt3, (used4 as any).opt3||0, 2);
  mkRow(list4, 't4', 'opt4', 'Permanently gain a +1 bonus to two Experiences.', (T4_LIMITS as any).opt4, (used4 as any).opt4||0);
  mkRow(list4, 't4', 'opt5', 'Choose an additional domain card (up to level 10).', (T4_LIMITS as any).opt5, (used4 as any).opt5||0);
  mkRow(list4, 't4', 'opt6', 'Permanently gain a +1 bonus to your Evasion.', (T4_LIMITS as any).opt6, (used4 as any).opt6||0);
  mkRow(list4, 't4', 'opt7', 'Increase your Proficiency by +1.', (T4_LIMITS as any).opt7, (used4 as any).opt7||0);
  mkRow(list4, 't4', 'opt8', 'Multiclass (see sheet for details).', (T4_LIMITS as any).opt8, (used4 as any).opt8||0, 2);
  mkRow(list4, 't4', 'opt9', 'Take an upgraded subclass card (cross out multiclass for this tier).', (T4_LIMITS as any).opt9, (used4 as any).opt9||0, 2);

  const actions = body.createDiv({ cls: 'dh-levelup-actions' });
  const applyBtn = actions.createEl('button', { cls: 'dh-event-btn', text: 'Apply Level Up' });
  const msg = actions.createDiv({ cls: 'dh-levelup-msg' });

  applyBtn.onclick = async () => {
    const sel = boxes.filter(b => b.el.checked && !b.el.disabled);
    if (sel.length !== 2) { msg.setText('Select exactly two options.'); return; }
    const selected = sel.map(s=> s.id.split('/')[0]);

    // If entering Tier 3, clear toggles first
    try {
      if (curLevel < 5 && nextLevelPreview >= 5) {
        const filePath = (file as TFile).path; const names = ['Agility','Strength','Finesse','Instinct','Presence','Knowledge'];
        for (const n of names) localStorage.removeItem(`dh:traitToggle:${filePath}:${n}`);
        try { window.dispatchEvent(new CustomEvent('dh:ability:refresh', { detail: { filePath } })); } catch {}
      }
    } catch {}

    // Collect per-tier trait picks for Opt1
    const pickedTraitsByTier: Record<'t2'|'t3'|'t4', string[]> = { t2: Array.from(picksByTier.t2), t3: Array.from(picksByTier.t3), t4: Array.from(picksByTier.t4) } as any;
    for (const s of sel) {
      const base = s.id.split('/')[0];
      if (base==='opt1'){
        if (pickedTraitsByTier[s.tier].length !== 2) { msg.setText('Option 1 requires selecting exactly two traits in its tier.'); return; }
      }
    }
    // Toggle chosen traits ON immediately
    try { const filePath = (file as TFile).path; ['t2','t3','t4'].forEach((t:any)=>{ for (const name of pickedTraitsByTier[t as 't2'|'t3'|'t4']) localStorage.setItem(`dh:traitToggle:${filePath}:${name}`,'1'); }); try { window.dispatchEvent(new CustomEvent('dh:ability:refresh', { detail: { filePath } })); } catch {} } catch{}

    // Reuse existing apply pipeline
    try {
      await plugin.app.fileManager.processFrontMatter(file as TFile, (front)=>{}); // keep file handle warm
    } catch {}

    // Delegate to existing logic by calling openLevelUpUI but in a headless way is complex.
    // So call the same internal code path by reusing our processFrontMatter below:
    try {
      await plugin.app.fileManager.processFrontMatter(file as TFile, (front) => {
        const cont2 = (front as any).dh_levelup?.t2 ?? ((front as any).dh_levelup = { ...(front as any).dh_levelup, t2: {} }, (front as any).dh_levelup.t2);
        const cont3 = (front as any).dh_levelup?.t3 ?? ((front as any).dh_levelup = { ...(front as any).dh_levelup, t3: {} }, (front as any).dh_levelup.t3);
        const cont4 = (front as any).dh_levelup?.t4 ?? ((front as any).dh_levelup = { ...(front as any).dh_levelup, t4: {} }, (front as any).dh_levelup.t4);
        const markArr2 = (((front as any).dh_marked_traits = ((front as any).dh_marked_traits ?? [])), (front as any).dh_marked_traits);
        const markArr3 = (((front as any).dh_levelup.t3.marked_traits = ((front as any).dh_levelup.t3.marked_traits ?? [])), (front as any).dh_levelup.t3.marked_traits);
        const markArr4 = (((front as any).dh_levelup.t4.marked_traits = ((front as any).dh_levelup.t4.marked_traits ?? [])), (front as any).dh_levelup.t4.marked_traits);

        const cur = Number(front.level ?? 1); const nextLevel = cur + 1; front.level = nextLevel;
        if (cur < 2 && nextLevel >= 2) front.tier = Number(front.tier ?? 1) + 1;
        if (cur < 8 && nextLevel >= 8) { (front as any).dh_marked_traits = []; if ((front as any).dh_levelup?.t3) (front as any).dh_levelup.t3.marked_traits = []; }
        if (nextLevel === 2 || nextLevel === 5 || nextLevel === 8) front.proficiency = Number((front as any).proficiency ?? 0) + 1;

        for (const s of sel){
          const base = s.id.split('/')[0];
          const tierC = s.tier==='t2'? cont2 : s.tier==='t3'? cont3 : cont4;
          const markArr = s.tier==='t2'? markArr2 : s.tier==='t3'? markArr3 : markArr4;
          const pickedTraits = pickedTraitsByTier[s.tier];
          switch(base){
            case 'opt1': (tierC as any).opt1 = Number((tierC as any).opt1||0)+1; for (const name of pickedTraits){ if (!markArr.includes(name)) markArr.push(name);} break;
            case 'opt2': (tierC as any).opt2 = Number((tierC as any).opt2||0)+1; front.hp = Number(front.hp||0)+1; break;
            case 'opt3': (tierC as any).opt3 = Number((tierC as any).opt3||0)+1; front.stress = Number(front.stress||0)+1; break;
            case 'opt4': (tierC as any).opt4 = Number((tierC as any).opt4||0)+1; break;
            case 'opt5': (tierC as any).opt5 = Number((tierC as any).opt5||0)+1; break;
            case 'opt6': (tierC as any).opt6 = Number((tierC as any).opt6||0)+1; front.evasion = Number(front.evasion||0)+1; break;
            case 'opt7': (tierC as any).opt7 = Number((tierC as any).opt7||0)+1; front.proficiency = Number((front as any).proficiency ?? 0) + 1; break;
            case 'opt8': (tierC as any).opt8 = Number((tierC as any).opt8||0)+1; break;
          }
        }
      });

      // Patch traits bonuses in either a ```traits block or inside the ```dashboard block's traits: section
      if (sel.some(s=> s.id.split('/')[0]==='opt1')){
        (async ()=>{
          const md = await plugin.app.vault.read(file as TFile);
          const esc=(s:string)=> s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
          const combined = Array.from(new Set([...(pickedTraitsByTier.t2||[]), ...(pickedTraitsByTier.t3||[]), ...(pickedTraitsByTier.t4||[])]));

          let outMd = md;
          let changed = false;

          // Try fenced ```traits block first
          try {
            const reTraits = /```[ \t]*traits[^\n]*\n([\s\S]*?)```/m;
            const m = outMd.match(reTraits);
            if (m) {
              let block = m[1];
              if (!/^\s*bonuses\s*:/m.test(block) && /^\s*trait\s*:/m.test(block)) block = block.replace(/^(\s*)trait\s*:\s*$/m,'$1bonuses:');
              if (!/^\s*bonuses\s*:/m.test(block)) block += `\nbonuses:\n`;
              const header = block.match(/^(\s*)bonuses\s*:\s*$/m);
              const headerIdx = header ? (header.index || 0) : -1;
              const headerLen = header ? header[0].length : 0;
              const baseIndent = header ? (header[1] || '') : '';
              const start = headerIdx >= 0 ? (headerIdx + headerLen) : block.length;
              const rest = block.slice(start);
              const nextTop = rest.search(new RegExp(`^${esc(baseIndent)}[^\s].*:\\s*$`, 'm'));
              const end = start + (nextTop >= 0 ? nextTop : rest.length);
              const before = block.slice(0, start);
              let middle = block.slice(start, end);
              const after = block.slice(end);
              for (const name of combined){
                const indent2 = baseIndent + '  ';
                const regList = new RegExp(`^${esc(indent2)}-\\s*${esc(name)}\\s*:\\s*(\\d+)?\\s*$`, 'm');
                const regMap  = new RegExp(`^${esc(indent2)}${esc(name)}\\s*:\\s*(\\d+)?\\s*$`, 'm');
                if (regList.test(middle)) { middle = middle.replace(regList, (_s,p1)=> `${indent2}- ${name}: ${Number(p1||0)+1}`); continue; }
                if (regMap.test(middle))  { middle = middle.replace(regMap,  (_s,p1)=> `${indent2}${name}: ${Number(p1||0)+1}`); continue; }
                const useList = new RegExp(`^${esc(indent2)}-\\s*\S+`, 'm').test(middle);
                const ins = (useList ? `${indent2}- ${name}: 1` : `${indent2}${name}: 1`) + '\n';
                middle = (middle.endsWith('\n') ? middle : middle + '\n') + ins;
              }
              const newBlock = before + middle + after;
              outMd = outMd.replace(reTraits, (all,_b)=> all.replace(m[1], newBlock));
              changed = true;
            }
          } catch {}

          // If no traits block changed, try updating inside the dashboard block's traits: section
          if (!changed) {
            try {
              const reDash = /```[ \t]*dashboard[^\n]*\n([\s\S]*?)```/m;
              const dm = outMd.match(reDash);
              if (dm) {
                let block = dm[1];
                // Locate traits: section bounds
                const tHead = block.match(/^\s*traits\s*:\s*$/m);
                if (tHead) {
                  const tIdx = tHead.index || 0; const tLen = tHead[0].length; const tIndent = '';
                  const tStart = tIdx + tLen;
                  const trest = block.slice(tStart);
                  const nextTop = trest.search(/^\w[\w-]*\s*:/m);
                  const tEnd = tStart + (nextTop >= 0 ? nextTop : trest.length);
                  const tbefore = block.slice(0, tStart);
                  let tmiddle = block.slice(tStart, tEnd);
                  const tafter = block.slice(tEnd);
                  // Ensure bonuses:
                  if (!/^\s*bonuses\s*:/m.test(tmiddle)) tmiddle = tmiddle.replace(/\s*$/,'') + `\n bonuses:\n`;
                  // Now find bonuses subsection within tmiddle
                  const bHead = tmiddle.match(/^\s*bonuses\s*:\s*$/m);
                  const bStart = (bHead ? ((bHead.index||0) + bHead[0].length) : tmiddle.length);
                  const bRest = tmiddle.slice(bStart);
                  const bNext = bRest.search(/^\s*\w[\w-]*\s*:/m);
                  const bEnd = bStart + (bNext >= 0 ? bNext : bRest.length);
                  const bbefore = tmiddle.slice(0, bStart);
                  let bmiddle = tmiddle.slice(bStart, bEnd);
                  const bafter = tmiddle.slice(bEnd);
                  for (const name of combined){
                    const indent2 = '  ';
                    const regMap = new RegExp(`^${esc(indent2)}${esc(name)}\\s*:\\s*(\\d+)?\\s*$`, 'm');
                    const regList = new RegExp(`^${esc(indent2)}-\\s*${esc(name)}\\s*:\\s*(\\d+)?\\s*$`, 'm');
                    if (regMap.test(bmiddle)) { bmiddle = bmiddle.replace(regMap, (_s,p1)=> `${indent2}${name}: ${Number(p1||0)+1}`); continue; }
                    if (regList.test(bmiddle)) { bmiddle = bmiddle.replace(regList, (_s,p1)=> `${indent2}- ${name}: ${Number(p1||0)+1}`); continue; }
                    // Prefer map style for dashboard traits
                    const ins = `${indent2}${name}: 1\n`;
                    bmiddle = (bmiddle.endsWith('\n') ? bmiddle : bmiddle + '\n') + ins;
                  }
                  const newTraitsMid = bbefore + bmiddle + bafter;
                  const newBlock = tbefore + newTraitsMid + tafter;
                  outMd = outMd.replace(reDash, (all,_b)=> all.replace(dm[1], newBlock));
                  changed = true;
                }
              }
            } catch {}
          }

          if (changed) await plugin.app.vault.modify(file as TFile, outMd);
        })();
      }

      msg.setText('Level Up applied.');
      // Rerender to reflect updated usage and marked traits (keep open state)
      const wasOpen = !body.hasClass('hidden');
      setTimeout(()=>{ try { el.empty(); renderInlineLevelUp(plugin, el, ctx, embedded); if (wasOpen) { const b = el.querySelector('.dh-levelup-body') as HTMLElement | null; const t = el.querySelector('.dh-levelup-header .dh-event-btn') as HTMLButtonElement | null; if (b) b.classList.remove('hidden'); if (t) t.innerText = 'Hide'; } } catch{} }, 50);
    } catch (e){ msg.setText('Level Up failed: ' + (e as any)?.message); }
  };
}

export function registerLevelUp(plugin: DaggerheartPlugin){
  plugin.registerMarkdownCodeBlockProcessor('levelup', async (src, el, ctx) => {
    el.empty();
    renderInlineLevelUp(plugin, el, ctx);
    const child = new MarkdownRenderChild(el); ctx.addChild(child);
  });
}
