import React from "react";

export function RestRowView({
  shortLabel,
  longLabel,
  onShort,
  onLong,
}: {
  shortLabel: string;
  longLabel: string;
  onShort: () => void;
  onLong: () => void;
}) {
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key.toLowerCase() === 's') { e.preventDefault(); onShort(); }
    else if (e.key.toLowerCase() === 'l') { e.preventDefault(); onLong(); }
    else if (e.key === 'Enter') { e.preventDefault(); onShort(); }
  };
  return (
    <div className="dh-rest-row" tabIndex={0} onKeyDown={onKeyDown} role="group" aria-label="Rest actions">
      <button className="dh-rest-trigger" onClick={onShort} title={`${shortLabel} (S or Enter)`}>{shortLabel}</button>
      <button className="dh-rest-trigger" onClick={onLong} title={`${longLabel} (L)`}>{longLabel}</button>
    </div>
  );
}

