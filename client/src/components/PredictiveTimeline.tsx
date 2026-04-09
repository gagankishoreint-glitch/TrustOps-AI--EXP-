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
  // Use exponential decay for more natural predictive curves
  const decayRate = score < 60 ? 0.25 : 0.15;
  const projected = score * Math.exp(-decayRate * (deltaMinutes / 10));
  return Math.max(3, Math.round(projected)); // Minimum floor of 3 to signify imminent failure
}

function nodeStyle(score: number) {
  if (score >= 80) return { ring: '#00d4ff', text: 'text-cyan-400',  label: 'Stable',   bg: 'bg-cyan-500/10' };
  if (score >= 60) return { ring: '#f59e0b', text: 'text-amber-400', label: 'Warning',  bg: 'bg-amber-500/10' };
  return               { ring: '#ef4444', text: 'text-red-400',   label: 'Critical', bg: 'bg-red-500/10' };
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

  return (
    <div className={`bg-white/[0.02] border rounded-2xl p-4 transition-all duration-500 ${
      currentScore < 60 ? 'shadow-[0_0_40px_rgba(239,68,68,0.2)] border-red-500/40' : 
      currentScore < 80 ? 'shadow-[0_0_40px_rgba(245,158,11,0.2)] border-amber-500/40' : 
      'border-white/[0.07]'
    }`}>
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <TrendingDown className={`w-4 h-4 ${degrading ? 'text-amber-400' : 'text-cyan-400'}`} />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Risk Trajectory Profile</h3>
        </div>
        {degrading && (
          <span className="text-[8px] font-bold text-red-500 animate-pulse uppercase tracking-widest">Degradation Active</span>
        )}
      </div>

      <div className="relative flex items-center justify-between px-2 py-4">
        {/* Connection Track */}
        <div className="absolute left-6 right-6 top-[50%] -translate-y-[150%] h-[1px] bg-white/10" />
        
        {nodes.map(({ label, score }, i) => {
          const s = nodeStyle(score);
          return (
            <div key={label} className="flex flex-col items-center z-10 gap-3">
              <div className="relative">
                {/* HUD Ring */}
                <svg className="w-14 h-14 -rotate-90 overflow-visible">
                  <circle cx="28" cy="28" r="26" fill="transparent" stroke="white" strokeWidth="1" strokeOpacity="0.05" />
                  <motion.circle
                    cx="28" cy="28" r="26"
                    fill="transparent"
                    stroke={s.ring}
                    strokeWidth="2"
                    strokeDasharray="163"
                    initial={{ strokeDashoffset: 163 }}
                    animate={{ strokeDashoffset: 163 - (score / 100) * 163 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                {/* Score Node */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-base font-black tabular-nums ${s.text}`} style={{ textShadow: `0 0 10px ${s.ring}44` }}>
                    {Math.round(score)}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-0.5">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">{label}</p>
                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${s.bg} ${s.text}`}>
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
