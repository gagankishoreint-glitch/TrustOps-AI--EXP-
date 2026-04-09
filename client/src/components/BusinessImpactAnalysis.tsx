import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Banknote, Timer, BarChart3 } from 'lucide-react';

interface BusinessImpactAnalysisProps {
  trustScore: number;
  hourlyRevenue?: number;
  latencySpikeDuration?: number;
}

function downtime(score: number): string {
  if (score >= 90) return '< 1 min';
  if (score >= 75) return `${Math.round((90 - score) * 0.5)} min`;
  if (score >= 60) return `${Math.round((90 - score) * 1.2)} min`;
  return `${Math.round((90 - score) * 2.1)} min`;
}

function revenue(score: number, baseRevenue: number): string {
  if (score >= 90) return '₹ 0';
  const riskFactor = (100 - score) / 40; // 0 to 2.5 multiplier
  const val = Math.round(baseRevenue * riskFactor);
  return `₹ ${val.toLocaleString('en-IN')}`;
}

function severity(score: number) {
  if (score >= 90) return { label: 'All Systems Nominal', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5' };
  if (score >= 75) return { label: 'Marginal Impact',     color: 'text-blue-400',  border: 'border-blue-500/30',  bg: 'bg-blue-500/5' };
  if (score >= 60) return { label: 'Moderate Disruption', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' };
  return               { label: 'Severe Operational Risk', color: 'text-red-400',   border: 'border-red-500/30',   bg: 'bg-red-500/5' };
}

export const BusinessImpactAnalysis: React.FC<BusinessImpactAnalysisProps> = ({ trustScore, hourlyRevenue = 12400 }) => {
  const sev = severity(trustScore);
  const isNominal = trustScore >= 90;

  return (
    <motion.div
      className={`bg-white/[0.02] border ${sev.border} rounded-2xl p-4`}
      animate={{ borderColor: isNominal ? 'rgba(6,182,212,0.3)' : 'rgba(239,68,68,0.3)' }}
      transition={{ duration: 1 }}
    >
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
        <BarChart3 className={`w-4 h-4 ${sev.color}`} />
        <h3 className={`text-xs font-bold uppercase tracking-widest ${sev.color}`}>Business Impact</h3>
        <span className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sev.border} ${sev.bg} ${sev.color}`}>
          {sev.label}
        </span>
      </div>

      {isNominal ? (
        <p className="text-gray-600 text-xs text-center py-2">No disruption detected. Uptime maintained.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Timer,      label: 'Est. Downtime',     value: downtime(trustScore),  color: 'text-amber-400' },
            { icon: Banknote,   label: 'Revenue Risk',      value: revenue(trustScore, hourlyRevenue),   color: 'text-red-400'   },
            { icon: TrendingDown, label: 'Recovery Time',   value: `${Math.round((100 - trustScore) * 0.6)} min`, color: 'text-violet-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-black/30 border border-white/[0.04] rounded-xl p-2.5 text-center">
              <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
              <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">{label}</p>
              <p className={`text-sm font-black tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
