/**
 * Badges view React component
 * 
 * Renders a grid of badge items (label + value pairs).
 * Used by: badges block, dashboard
 */
import React from "react";

export type BadgeRow = { label: string; value: string };

export function BadgesView({ items, reverse }: { items: BadgeRow[]; reverse?: boolean }) {
  const rows = items;
  return (
    <div className="dh-badges">
      {rows.map((it, idx) => (
        <div key={idx} className="dh-badge">
          {reverse ? (
            <>
              <span className="dh-badge-value">{it.value}</span>
              <span className="dh-badge-label">{it.label}</span>
            </>
          ) : (
            <>
              <span className="dh-badge-label">{it.label}</span>
              <span className="dh-badge-value">{it.value}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

