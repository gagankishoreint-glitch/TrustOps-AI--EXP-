import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const TrustScoreGauge = React.memo(({ score }: { score: number }) => {
  const clamped = Math.min(100, Math.max(0, score));

  // ViewBox: 0 0 200 120. Arc center at (100, 108), radius 80.
  // This puts the arc pivot near the BOTTOM of the SVG so the half-circle is fully visible.
  const R = 80;
  const cx = 100;
  const cy = 108;
  const VW = 200;
  const VH = 120;

  // For CSS transform-origin (percentage in element space)
  const originX = `${(cx / VW) * 100}%`; // 50%
  const originY = `${(cy / VH) * 100}%`; // 90%

  const arcLength = Math.PI * R; // ~251.3 — half circle circumference

  const strokeDasharray = arcLength;
  const strokeDashoffset = arcLength * (1 - clamped / 100);

  // Needle starts pointing LEFT at score=0, UP at score=50, RIGHT at score=100
  // The needle line goes horizontally right from center, then we rotate it
  // At score 0:   rotate -180° → points left  ✓
  // At score 50:  rotate  -90° → points up    ✓
  // At score 100: rotate    0° → points right ✓
  const needleRotate = (clamped / 100) * 180 - 180;

  const color = useMemo(() => {
    if (clamped >= 80) return {
      stroke: '#22c55e',
      text: 'text-green-400',
      badge: 'border-green-500/40 bg-green-950/30 text-green-400',
      label: 'Nominal',
      glow: 'rgba(34,197,94,0.15)'
    };
    if (clamped >= 60) return {
      stroke: '#eab308',
      text: 'text-yellow-400',
      badge: 'border-yellow-500/40 bg-yellow-950/30 text-yellow-400',
      label: 'Caution',
      glow: 'rgba(234,179,8,0.15)'
    };
    return {
      stroke: '#ef4444',
      text: 'text-red-400',
      badge: 'border-red-500/40 bg-red-950/30 text-red-400',
      label: 'Critical',
      glow: 'rgba(239,68,68,0.15)'
    };
  }, [clamped]);

  const spring = { type: 'spring' as const, stiffness: 55, damping: 14 };

  return (
    <div className="flex flex-col items-center w-full select-none py-2">
      <div className="relative w-full max-w-[200px]">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ overflow: 'visible' }}>
          {/* Background track */}
          <path
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none"
            stroke="#1e2736"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Active filled arc */}
          <motion.path
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none"
            stroke={color.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            animate={{ strokeDashoffset, stroke: color.stroke }}
            transition={spring}
            style={{ filter: `drop-shadow(0 0 6px ${color.glow})` }}
          />

          {/* Tick marks at 0 / 25 / 50 / 75 / 100 */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const a = ((pct / 100) * 180 - 180) * (Math.PI / 180);
            return (
              <line
                key={pct}
                x1={cx + 63 * Math.cos(a)} y1={cy + 63 * Math.sin(a)}
                x2={cx + 72 * Math.cos(a)} y2={cy + 72 * Math.sin(a)}
                stroke="#374151"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* ── Needle ─────────────────────────────────────────── */}
          {/* The needle line goes RIGHT from (cx, cy). We rotate it. */}
          {/* transformOrigin must be % of SVG element's CSS pixel size */}
          <motion.g
            animate={{ rotate: needleRotate }}
            transition={spring}
            style={{ transformOrigin: `${originX} ${originY}` }}
          >
            <motion.g
              animate={{ rotate: [-0.35, 0.35] }}
              transition={{ repeat: Infinity, duration: 0.1, repeatType: 'mirror', ease: 'linear' }}
              style={{ transformOrigin: `${originX} ${originY}` }}
            >
              {/* Main shaft */}
              <line
                x1={cx} y1={cy}
                x2={cx + 70} y2={cy}
                stroke="#e5e7eb"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Counterweight nub */}
              <line
                x1={cx} y1={cy}
                x2={cx - 12} y2={cy}
                stroke="#6b7280"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </motion.g>
          </motion.g>

          {/* Pivot hub — drawn AFTER needle so it's on top */}
          <circle cx={cx} cy={cy} r="7" fill="#0f1623" stroke="#1f2937" strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="3.5" fill="#6b7280" />
        </svg>

        {/* Score — positioned above the pivot, inside the arc area */}
        <div
          className="absolute left-0 right-0 flex justify-center"
          style={{ bottom: `${(1 - (cy - 30) / VH) * 100}%` }}
        >
          <motion.span
            key={Math.round(clamped)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`text-5xl font-black tracking-tighter leading-none tabular-nums ${color.text}`}
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>

      {/* Status pill */}
      <motion.div
        animate={{ borderColor: color.stroke }}
        transition={spring}
        className={`mt-3 px-5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${color.badge}`}
      >
        {color.label}
      </motion.div>
    </div>
  );
});
