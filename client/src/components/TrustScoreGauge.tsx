import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const TrustScoreGauge = React.memo(({ score }: { score: number }) => {
  const clamped = Math.min(100, Math.max(0, score));

  // SVG: 200×110 viewBox. Arc pivot at (100, 105), radius 88.
  // Arc sweeps from left (180°) to right (0°) — a perfect half circle.
  const CX = 100, CY = 105, R = 88;
  const arcLen = Math.PI * R;

  const filledLen = (clamped / 100) * arcLen;
  // Needle angle: -180° at 0, -90° at 50, 0° at 100
  // Needle points RIGHT at angle 0. We store in degrees for Framer.
  const needleDeg = (clamped / 100) * 180 - 180;

  // Bulletproof SVG rotation: Use percentages relative to the viewBox
  // CX=100, CY=105 on a 200x110 viewBox
  const originX = 100 / 200; // 0.5
  const originY = 105 / 110; // 0.9545
  
  const clr = useMemo(() => {
    if (clamped >= 80) return { stroke: '#00d4ff', text: 'text-cyan-400',   badge: 'border-cyan-500/40  bg-cyan-500/10  text-cyan-400',   label: 'Nominal',   glow: '#00d4ff' };
    if (clamped >= 60) return { stroke: '#f59e0b', text: 'text-amber-400',  badge: 'border-amber-500/40 bg-amber-500/10 text-amber-400',  label: 'Caution',   glow: '#f59e0b' };
    return               { stroke: '#ef4444', text: 'text-red-400',    badge: 'border-red-500/40   bg-red-500/10   text-red-400',    label: 'Critical',  glow: '#ef4444' };
  }, [clamped]);
 
  // SNAPPY SPRING — Resolve "Takes a lot of time" feeling
  const spring = { type: 'spring' as const, stiffness: 120, damping: 20, mass: 1 };
 
  return (
    <div className="flex flex-col items-center w-full select-none">
      <div className="relative w-full max-w-[210px]">
        <svg viewBox="0 0 200 110" className="w-full" overflow="visible">
          {/* Background arc */}
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round"
          />
          {/* Active arc */}
          <motion.path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke={clr.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={arcLen}
            animate={{ strokeDashoffset: arcLen - filledLen, stroke: clr.stroke }}
            transition={spring}
            style={{ filter: `drop-shadow(0 0 8px ${clr.glow}66)` }}
          />
          {/* Tick marks at 0, 25, 50, 75, 100 */}
          {[0, 25, 50, 75, 100].map(p => {
            const a = ((p / 100) * 180 - 180) * (Math.PI / 180);
            return (
              <line key={p}
                x1={CX + (R - 10) * Math.cos(a)} y1={CY + (R - 10) * Math.sin(a)}
                x2={CX + (R - 3)  * Math.cos(a)} y2={CY + (R - 3)  * Math.sin(a)}
                stroke="#334155" strokeWidth="1.5" strokeLinecap="round"
              />
            );
          })}
          {/* Needle and Hub removed for a cleaner look */}
        </svg>

        {/* Score number — perfectly centered in the HUD arc */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: '22%' }}>
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            className={`text-6xl font-black tabular-nums tracking-tighter ${clr.text}`}
            style={{ fontVariantNumeric: 'tabular-nums', textShadow: `0 0 15px ${clr.glow}22` }}
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>

      {/* Status badge */}
      <motion.div
        animate={{ borderColor: clr.stroke }}
        className={`mt-2 px-5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${clr.badge}`}
      >
        {clr.label}
      </motion.div>
    </div>
  );
});
