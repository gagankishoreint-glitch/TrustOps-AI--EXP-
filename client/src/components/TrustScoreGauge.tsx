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

  // Origin as % of SVG element (200px wide, 110px tall)
  const ox = `${(CX / 200) * 100}%`;  // 50%
  const oy = `${(CY / 110) * 100}%`;  // 95.45...%

  const clr = useMemo(() => {
    if (clamped >= 80) return { stroke: '#00d4ff', text: 'text-cyan-400',   badge: 'border-cyan-500/40  bg-cyan-500/10  text-cyan-400',   label: 'Nominal',   glow: '#00d4ff' };
    if (clamped >= 60) return { stroke: '#f59e0b', text: 'text-amber-400',  badge: 'border-amber-500/40 bg-amber-500/10 text-amber-400',  label: 'Caution',   glow: '#f59e0b' };
    return               { stroke: '#ef4444', text: 'text-red-400',    badge: 'border-red-500/40   bg-red-500/10   text-red-400',    label: 'Critical',  glow: '#ef4444' };
  }, [clamped]);

  const spring = { type: 'spring' as const, stiffness: 55, damping: 16 };

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
          {/* Needle */}
          <motion.g
            animate={{ rotate: needleDeg }}
            transition={spring}
            style={{ transformOrigin: `${ox} ${oy}` }}
          >
            <motion.g
              animate={{ rotate: [-0.3, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.12, repeatType: 'mirror', ease: 'linear' }}
              style={{ transformOrigin: `${ox} ${oy}` }}
            >
              {/* Main shaft pointing right */}
              <line x1={CX} y1={CY} x2={CX + R - 8} y2={CY}
                stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round"
              />
              {/* Counterweight */}
              <line x1={CX} y1={CY} x2={CX - 14} y2={CY}
                stroke="#475569" strokeWidth="3" strokeLinecap="round"
              />
            </motion.g>
          </motion.g>
          {/* Hub */}
          <circle cx={CX} cy={CY} r="7" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
          <circle cx={CX} cy={CY} r="3" fill={clr.stroke} style={{ filter: `drop-shadow(0 0 4px ${clr.glow})` }} />
        </svg>

        {/* Score number — sits above the arc center, separated from needle */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: '26%' }}>
          <motion.span
            key={Math.round(clamped)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`text-5xl font-black tabular-nums tracking-tight ${clr.text}`}
            style={{ fontVariantNumeric: 'tabular-nums', textShadow: `0 0 20px ${clr.glow}44` }}
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
