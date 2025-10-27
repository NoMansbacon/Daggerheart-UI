import React, { useState } from "react";

export function DamageInlineView({
  title,
  majorThreshold,
  severeThreshold,
  level,
  onApply,
}: {
  title: string;
  majorThreshold?: number;
  severeThreshold?: number;
  level?: number;
  onApply: (damage: number, reduceTiers: number) => void;
}) {
  const [dmg, setDmg] = useState<string>("0");
  const [reduce, setReduce] = useState<string>("0");

  // Display thresholds with level added when level is provided.
  const displayMajor = Number.isFinite(majorThreshold as any)
    ? (majorThreshold as number) + (Number.isFinite(level as any) ? (level as number) : 0)
    : undefined;
  const displaySevere = Number.isFinite(severeThreshold as any)
    ? (severeThreshold as number) + (Number.isFinite(level as any) ? (level as number) : 0)
    : undefined;

  return (
    <div className="dh-damage-inline">
      <div className="dh-rest-title">{title}</div>

      {/* Visual tiers: Minor → Major → Severe */}
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
            onChange={(e) => setDmg(e.currentTarget.value)}
          />
        </div>
        <div className="dh-dmg-group">
          <label className="dh-dmg-label"># Armor slots used</label>
          <input
            className="dh-dmg-input"
            type="number"
            min={0}
            value={reduce}
            onChange={(e) => setReduce(e.currentTarget.value)}
          />
        </div>
        <button
          className="dh-event-btn"
          onClick={() => onApply(Number(dmg || 0), Number(reduce || 0))}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

