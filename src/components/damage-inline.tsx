/**
 * Damage inline calculator React component
 * 
 * Compact damage input form with tier visualization.
 * Inputs: raw damage amount, armor slots used
 * Displays: major/severe thresholds
 * 
 * Used by: damage block, dashboard
 */
import React, { useState } from "react";

export function DamageInlineView({
  title,
  majorThreshold,
  severeThreshold,
  level,
  onApply,
}: {
  title?: string;
  majorThreshold?: number;
  severeThreshold?: number;
  level?: number;
  onApply: (damage: number, reduceTiers: number) => void | Promise<void>;
}) {
  const [dmg, setDmg] = useState<string>("0");
  const [reduce, setReduce] = useState<string>("0");
  const [busy, setBusy] = useState<boolean>(false);

  // Display thresholds with level added when level is provided.
  const displayMajor = Number.isFinite(majorThreshold as any)
    ? (majorThreshold as number) + (Number.isFinite(level as any) ? (level as number) : 0)
    : undefined;
  const displaySevere = Number.isFinite(severeThreshold as any)
    ? (severeThreshold as number) + (Number.isFinite(level as any) ? (level as number) : 0)
    : undefined;

  return (
    <div className="dh-damage-inline">
      <div className="dh-dmg-steps" role="group">
        <div className="step">
          <div className="label">MINOR<br/>DAMAGE</div>
          <div className="meta">Mark 1 HP</div>
        </div>
        <div className="conn"><span className="value">{Number.isFinite(displayMajor as any) ? displayMajor : ""}</span></div>
        <div className="step">
          <div className="label">MAJOR<br/>DAMAGE</div>
          <div className="meta">Mark 2 HP</div>
        </div>
        <div className="conn"><span className="value">{Number.isFinite(displaySevere as any) ? displaySevere : ""}</span></div>
        <div className="step">
          <div className="label">SEVERE<br/>DAMAGE</div>
          <div className="meta">Mark 3 HP</div>
        </div>
      </div>

      <div className="dh-dmg-row">
        <div className="dh-dmg-group">
          <label className="dh-dmg-label">Damage</label>
          <input
            className="dh-dmg-input"
            type="number"
            min={0}
            value={dmg}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.currentTarget.closest('.dh-dmg-row') as HTMLElement)?.querySelector('button.dh-event-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              }
            }}
            onChange={(e) => setDmg(e.currentTarget.value)}
          />
        </div>
        <div className="dh-dmg-group">
          <label className="dh-dmg-label"># Armor slots used</label>
          <input
            className="dh-dmg-input"
            type="number"
            min={0}
            max={3}
            value={reduce}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.currentTarget.closest('.dh-dmg-row') as HTMLElement)?.querySelector('button.dh-event-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              }
            }}
            onChange={(e) => setReduce(e.currentTarget.value)}
          />
        </div>
        <button
          className="dh-event-btn"
          disabled={busy}
          onClick={async () => {
            try {
              setBusy(true);
              await Promise.resolve(onApply(Number(dmg || 0), Number(reduce || 0)));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </div>
  );
}

