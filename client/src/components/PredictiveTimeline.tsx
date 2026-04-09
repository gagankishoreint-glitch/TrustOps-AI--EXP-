import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Clock, Activity } from 'lucide-react';
import { TrustScores } from './MultiScoreDisplay';

interface PredictiveTimelineProps {
  currentScore: number;
  trustScores: TrustScores;
  predictedTTF: number | null;
  isDemo?: boolean;
}

function project(score: number, deltaMinutes: number): number {
  if (score >= 80) return score; // stable
  const slope = score < 60 ? -2.5 : -1.8;
  return Math.max(0, Math.round(score + slope * deltaMinutes));
}

function nodeStyle(score: number) {
  if (score >= 80) return { ring: '#00d4ff', text: 'text-cyan-400',  label: 'Stable',   bg: 'bg-cyan-950/40' };
  if (score >= 60) return { ring: '#f59e0b', text: 'text-amber-400', label: 'Caution',  bg: 'bg-amber-950/40' };
  return               { ring: '#ef4444', text: 'text-red-400',   label: 'Critical', bg: 'bg-red-950/40' };
}

function ttfStyle(ttf: number) {
  if (ttf < 10) return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-500' };
  if (ttf < 30) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-500' };
  return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-500' };
}

export const PredictiveTimeline: React.FC<PredictiveTimelineProps> = React.memo(({ currentScore, predictedTTF }) => {
  const p10  = project(currentScore, 10);
  const p30  = project(currentScore, 30);
  const p60  = project(currentScore, 60);
  const degrading = currentScore < 80;

  const nodes = [
    { label: 'Now',     score: currentScore },
    { label: '+10 min', score: p10 },
    { label: '+30 min', score: p30 },
    { label: '+1 hr',   score: p60 },
  ];

  const ttf = predictedTTF;

  return (
    <div className={`bg-white/[0.02] border rounded-2xl p-4 transition-all duration-500 ${
      currentScore < 60 ? 'shadow-[0_0_40px_rgba(239,68,68,0.2)] border-red-500/40 animate-pulse' : 
      currentScore < 80 ? 'shadow-[0_0_40px_rgba(245,158,11,0.2)] border-amber-500/40 animate-pulse' : 
      'border-white/[0.07]'
    }`}>
      {/* TTF logic removed */}

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <TrendingDown className={`w-4 h-4 ${degrading ? 'text-amber-400' : 'text-cyan-400'}`} />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Risk Trajectory</h3>
        </div>
      </div>

      {/* Timeline bar */}
      <div className="relative flex items-center justify-between px-2">
        {/* Track */}
        <div className="absolute left-4 right-4 top-6 h-0.5 bg-white/[0.06]" />
        {degrading && (
          <motion.div
            className="absolute left-4 right-4 top-6 h-0.5 bg-gradient-to-r from-amber-500/40 to-red-600/80"
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1 }}
            style={{ transformOrigin: 'left' }}
          />
        )}

        {nodes.map(({ label, score }) => {
          const s = nodeStyle(score);
          return (
            <div key={label} className="flex flex-col items-center z-10 gap-1.5">
              <motion.div
                animate={{ boxShadow: `0 0 10px ${s.ring}44` }}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm tabular-nums ${s.bg} ${s.text}`}
                style={{ borderColor: s.ring }}
              >
                {score}
              </motion.div>
              <p className="text-[10px] text-gray-500">{label}</p>
              <p className={`text-[9px] font-bold uppercase ${s.text}`}>{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
});
