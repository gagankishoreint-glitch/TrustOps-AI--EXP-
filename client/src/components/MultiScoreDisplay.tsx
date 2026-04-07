import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export interface TrustScores {
  operational: number;
  security: number;
  behavior: number;
  performance: number;
}

const SCORE_META = [
  { key: 'operational' as const, label: 'Network Integrity',  shortLabel: 'Network' },
  { key: 'security'    as const, label: 'Access Control',     shortLabel: 'Access' },
  { key: 'behavior'   as const, label: 'User Behaviour',     shortLabel: 'Behaviour' },
  { key: 'performance' as const, label: 'Device Health',      shortLabel: 'Devices' },
];

function getColor(score: number) {
  if (score >= 80) return { bar: '#00d4ff', text: 'text-cyan-400',  track: '#0e3a45' };
  if (score >= 60) return { bar: '#f59e0b', text: 'text-amber-400', track: '#3d2e05' };
  return               { bar: '#ef4444', text: 'text-red-400',   track: '#3d0b0b' };
}

export const MultiScoreDisplay: React.FC<{ scores: TrustScores }> = ({ scores }) => {
  const prevRef = useRef<TrustScores>(scores);

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Sub-Score Breakdown</p>
      {SCORE_META.map(({ key, label }) => {
        const score = Math.round(scores[key]);
        const prev  = Math.round(prevRef.current[key]);
        const delta = score - prev;
        const clr   = getColor(score);

        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
              <div className="flex items-center gap-1.5">
                {delta !== 0 && (
                  <span className={`text-[9px] font-bold ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}
                  </span>
                )}
                <span className={`text-sm font-black tabular-nums ${clr.text}`}>{score}</span>
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: clr.track }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: clr.bar, boxShadow: `0 0 6px ${clr.bar}66` }}
                animate={{ width: `${score}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
