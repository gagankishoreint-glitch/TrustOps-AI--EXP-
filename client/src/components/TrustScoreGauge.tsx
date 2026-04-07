import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const TrustScoreGauge = React.memo(({ score }: { score: number }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const angle = useMemo(() => (normalizedScore / 100) * 180 - 90, [normalizedScore]);
  
  const statusColor = useMemo(() => {
    if (normalizedScore >= 80) return '#22c55e'; // green-500
    if (normalizedScore >= 60) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  }, [normalizedScore]);

  const statusText = useMemo(() => {
    if (normalizedScore >= 80) return 'Nominal';
    if (normalizedScore >= 60) return 'Caution';
    return 'Critical';
  }, [normalizedScore]);

  // Framer Motion Spring config
  const springConfig = { type: "spring" as const, stiffness: 60, damping: 10 };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden mb-6">
        <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
          {/* Background Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#1f2937"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Active Gradient Track */}
          <motion.path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={statusColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="126"
            animate={{ strokeDashoffset: 126 - (normalizedScore / 100) * 126, stroke: statusColor }}
            transition={springConfig}
          />

          {/* Needle with Micro-Vibration */}
          <motion.g
            animate={{ 
              rotate: [angle - 0.2, angle + 0.2, angle] 
            }}
            transition={{
              rotate: {
                repeat: Infinity,
                duration: 0.1,
                repeatType: 'reverse'
              },
              ...springConfig // Still honors the overarching physical spring move
            }}
            style={{ transformOrigin: '50% 50%' }}
          >
            {/* The physical dial shape */}
            <path d="M 49 50 L 51 50 L 50 15 Z" fill="#9ca3af" />
            <circle cx="50" cy="50" r="3" fill="#111827" stroke="#9ca3af" strokeWidth="1" />
          </motion.g>
        </svg>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
          <span className="text-4xl font-bold text-gray-100 block tracking-tighter shadow-sm">{Math.round(score)}</span>
        </div>
      </div>
      <div className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-widest border ${
        statusText === 'Critical' ? 'bg-red-950/20 text-red-500 border-red-500/50' : 
        statusText === 'Caution' ? 'bg-yellow-950/20 text-yellow-500 border-yellow-500/50' : 
        'bg-green-950/20 text-green-500 border-green-500/50'
      }`}>
        {statusText}
      </div>
    </div>
  );
});
