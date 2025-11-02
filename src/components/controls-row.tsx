import React from "react";

export type ControlsRowProps = {
  // Visibility toggles
  showShort?: boolean;
  showLong?: boolean;
  showLevelUp?: boolean;
  showFullHeal?: boolean;
  showResetAll?: boolean;

  // Labels
  shortLabel?: string;
  longLabel?: string;
  levelupLabel?: string;
  fullHealLabel?: string;
  resetAllLabel?: string;

  // Handlers
  onShort?: () => void;
  onLong?: () => void;
  onLevelUp?: () => void;
  onFullHeal?: () => void;
  onResetAll?: () => void;
};

export function ControlsRowView(props: ControlsRowProps) {
  const {
    showShort = true,
    showLong = true,
    showLevelUp = false,
    showFullHeal = false,
    showResetAll = false,

    shortLabel = "Short Rest",
    longLabel = "Long Rest",
    levelupLabel = "Level Up",
    fullHealLabel = "Full Heal",
    resetAllLabel = "Reset All",

    onShort,
    onLong,
    onLevelUp,
    onFullHeal,
    onResetAll,
  } = props;

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const k = e.key.toLowerCase();
    if (k === 's' && showShort && onShort) { e.preventDefault(); onShort(); }
    else if (k === 'l' && showLong && onLong) { e.preventDefault(); onLong(); }
    else if (k === 'enter' && showShort && onShort) { e.preventDefault(); onShort(); }
  };

  return (
    <div className="dh-control-row" tabIndex={0} onKeyDown={onKeyDown}>
      {showShort && (
        <button className="dh-rest-trigger" onClick={onShort} title={`${shortLabel} (S or Enter)`}>{shortLabel}</button>
      )}
      {showLong && (
        <button className="dh-rest-trigger" onClick={onLong} title={`${longLabel} (L)`}>{longLabel}</button>
      )}
      {showLevelUp && (
        <button className="dh-rest-trigger" onClick={onLevelUp}>{levelupLabel}</button>
      )}
      {showFullHeal && (
        <button className="dh-rest-trigger" onClick={onFullHeal}>{fullHealLabel}</button>
      )}
      {showResetAll && (
        <button className="dh-rest-trigger" onClick={onResetAll}>{resetAllLabel}</button>
      )}
    </div>
  );
}