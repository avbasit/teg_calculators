function starPoints(cx: number, cy: number, r: number, rotateDeg: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.382;
    const a = ((rotateDeg - 90 + i * 36) * Math.PI) / 180;
    pts.push(`${(cx + radius * Math.cos(a)).toFixed(1)},${(cy + radius * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Flag of St. Kitts & Nevis. */
export function SknFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 750 500" className={className} role="img" aria-label="Flag of St. Kitts and Nevis">
      <rect width="750" height="500" fill="#CE1126" />
      <polygon points="0,0 750,0 0,500" fill="#009E49" />
      <line x1="-20" y1="513" x2="770" y2="-13" stroke="#FCD116" strokeWidth="220" />
      <line x1="-20" y1="513" x2="770" y2="-13" stroke="#000" strokeWidth="150" />
      <polygon points={starPoints(232, 346, 54, -34)} fill="#fff" />
      <polygon points={starPoints(518, 154, 54, -34)} fill="#fff" />
    </svg>
  );
}

/** Placeholder tile for countries without a flag asset yet. */
export function CountryMonogram({ code, className }: { code: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-brand to-brand-night font-display text-lg font-bold tracking-wider text-white/90 ${className ?? ""}`}
    >
      {code}
    </div>
  );
}
