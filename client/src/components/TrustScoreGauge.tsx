import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const TrustScoreGauge = React.memo(({ score }: { score: number }) => {
  const clamped = Math.min(100, Math.max(0, score));

  // Gauge arc math — SVG viewBox 0 0 200 120
  // Arc center: (100, 100), radius: 80
  // Arc spans from 180° (left) to 0° (right)
  const R = 80;
  const cx = 100;
  const cy = 100;

  const arcLength = Math.PI * R; // half-circumference

  // Filled arc offset (how much of the 180° arc to fill)
  const filledRatio = clamped / 100;
  const strokeDasharray = arcLength;
  const strokeDashoffset = arcLength * (1 - filledRatio);

  // Needle angle: -90° (left) at 0, 0° (up) at 50, +90° (right) at 100
  const needleAngle = (clamped / 100) * 180 - 180; // mapped to -180..0 from left side

  const color = useMemo(() => {
    if (clamped >= 80) return { stroke: '#22c55e', text: 'text-green-400', badge: 'bg-green-950/30 text-green-400 border-green-500/40', label: 'Nominal' };
    if (clamped >= 60) return { stroke: '#eab308', text: 'text-yellow-400', badge: 'bg-yellow-950/30 text-yellow-400 border-yellow-500/40', label: 'Caution' };
    return { stroke: '#ef4444', text: 'text-red-400', badge: 'bg-red-950/30 text-red-400 border-red-500/40', label: 'Critical' };
  }, [clamped]);

  const springCfg = { type: 'spring' as const, stiffness: 50, damping: 14 };

  return (
    <div className="flex flex-col items-center w-full select-none">
      <div className="relative w-full max-w-[220px]">
        <svg viewBox="0 0 200 110" className="w-full overflow-visible">
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none"
            stroke="#1f2937"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Filled arc with spring animation */}
          <motion.path
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none"
            stroke={color.stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            animate={{ strokeDashoffset, stroke: color.stroke }}
            transition={springCfg}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const angle = ((pct / 100) * 180 - 180) * (Math.PI / 180);
            const innerR = 62;
            const outerR = 70;
            const x1 = cx + innerR * Math.cos(angle);
            const y1 = cy + innerR * Math.sin(angle);
            const x2 = cx + outerR * Math.cos(angle);
            const y2 = cy + outerR * Math.sin(angle);
            return (
              <line
                key={pct}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#374151"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {/* Needle — outer motion.g rotates, inner provides the needle shape */}
          <motion.g
            animate={{ rotate: needleAngle }}
            transition={springCfg}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            {/* Micro-vibration wrapper */}
            <motion.g
              animate={{ rotate: [-0.4, 0.4] }}
              transition={{ repeat: Infinity, duration: 0.09, repeatType: 'reverse', ease: 'linear' }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              {/* Needle shaft — thin, sharp */}
              <line
                x1={cx} y1={cy}
                x2={cx + R - 6} y2={cy}
                stroke="#f9fafb"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Needle counterweight */}
              <line
                x1={cx} y1={cy}
                x2={cx - 14} y2={cy}
                stroke="#6b7280"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </motion.g>
          </motion.g>

          {/* Pivot hub */}
          <circle cx={cx} cy={cy} r="6" fill="#111827" stroke="#374151" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="3" fill="#9ca3af" />
        </svg>

        {/* Score number — sits above needle, below arc center */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-1">
          <motion.span
            key={Math.round(clamped)}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={`text-5xl font-black tracking-tighter leading-none ${color.text}`}
          >
            {Math.round(score)}
          </motion.span>
        </div>
      </div>

      {/* Status badge */}
      <div className={`mt-4 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${color.badge}`}>
        {color.label}
      </div>
    </div>
  );
});
