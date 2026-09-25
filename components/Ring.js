// Ring progress melingkar (donut) modern dengan efek glowing & gradasi warna
export default function Ring({
  percent = 0,
  size = 120,
  stroke = 10,
  color,
  gradient = 'emerald', // 'emerald' | 'violet' | 'rose' | 'amber' | 'cyan' | 'none'
  track = 'rgba(255, 255, 255, 0.06)',
  glow = true,
  children,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const gradientId = `ring-grad-${gradient}-${size}`;
  const filterId = `ring-glow-${gradient}-${size}`;

  const gradientDefs = {
    emerald: {
      from: '#34d399',
      to: '#06b6d4',
      shadow: 'rgba(52, 211, 153, 0.45)',
    },
    violet: {
      from: '#a78bfa',
      to: '#ec4899',
      shadow: 'rgba(167, 139, 250, 0.45)',
    },
    rose: {
      from: '#fb7185',
      to: '#f43f5e',
      shadow: 'rgba(251, 113, 133, 0.45)',
    },
    amber: {
      from: '#fbbf24',
      to: '#f59e0b',
      shadow: 'rgba(251, 191, 36, 0.45)',
    },
    cyan: {
      from: '#38bdf8',
      to: '#3b82f6',
      shadow: 'rgba(56, 189, 248, 0.45)',
    },
  };

  const selectedGrad = gradientDefs[gradient] || gradientDefs.emerald;
  const strokeColor = color ? color : gradient !== 'none' ? `url(#${gradientId})` : '#fafafa';

  return (
    <div
      className="ring-wrap"
      style={{
        width: size,
        height: size,
        position: 'relative',
        flexShrink: 0,
        filter: glow ? `drop-shadow(0 0 10px ${selectedGrad.shadow})` : 'none',
      }}
    >
      <svg width={size} height={size} style={{ display: 'block' }} aria-hidden="true">
        <defs>
          {gradient !== 'none' && !color && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={selectedGrad.from} />
              <stop offset="100%" stopColor={selectedGrad.to} />
            </linearGradient>
          )}
        </defs>
        {/* Track / Jalur abu-abu transparan */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Bar Progres dengan ujung bulat */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={strokeColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </svg>
      {children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
