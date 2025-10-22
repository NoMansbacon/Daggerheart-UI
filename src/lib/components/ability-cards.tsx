// src/lib/components/ability-cards.tsx
import React, { useState } from "react";
import type { AbilityCard } from "../domains/abilities";

/**
 * Props:
 *  - data: array of cards (AGI/STR/FIN/INS/PRE/KNO)
 * Renders:
 *  - .dh-ability-cards grid
 *  - each .dh-ability-card with header (abbr + gold toggle) and big total
 *  - when toggled, the card gets .proficient (for your gold outline)
 */
export function AbilityView({ data }: { data: AbilityCard[] }) {
  // Local UI copy to manage toggles without re-parsing YAML
  const [cards, setCards] = useState<AbilityCard[]>(data);

  const onToggle = (idx: number) => {
    setCards((prev) => {
      const next = [...prev];
      const c = { ...next[idx] };
      c.toggled = !c.toggled;

      // persist this specific ability’s toggle
      try {
        localStorage.setItem(c.storageKey, c.toggled ? "1" : "0");
      } catch {}

      next[idx] = c;
      return next;
    });
  };

  return (
    <div className="dh-ability-cards">
      {cards.map((c, i) => (
        <div
          key={c.name}
          className={`dh-ability-card${c.toggled ? " proficient" : ""}`}
          title={c.name}
        >
          <div className="dh-ability-name">
            <span>{c.label}</span>
            <span
              className={`dh-toggle${c.toggled ? " on" : ""}`}
              role="button"
              aria-pressed={c.toggled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggle(i);
              }}
              title="Toggle"
            />
          </div>

          <div
            className={
              "dh-ability-total " + (c.total > 0 ? "dh-pos" : c.total < 0 ? "dh-neg" : "dh-zero")
            }
          >
            {c.total > 0 ? `+${c.total}` : String(c.total)}
          </div>
        </div>
      ))}
    </div>
  );
}
