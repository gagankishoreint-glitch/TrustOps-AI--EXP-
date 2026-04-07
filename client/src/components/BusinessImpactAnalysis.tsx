import React, { useMemo } from 'react';
import { AlertCircle, Clock, Users, Activity, TrendingDown, Shield } from 'lucide-react';
import { calculateJointProbability } from '../utils/predictiveEngine';
import { TrustScores } from './MultiScoreDisplay';

interface BusinessImpactAnalysisProps {
  currentScore: number;
  trustScores: TrustScores;
}

export const BusinessImpactAnalysis: React.FC<BusinessImpactAnalysisProps> = React.memo(({ currentScore, trustScores }) => {
  
  // Independent Probability Engine
  const jointProb = calculateJointProbability(trustScores);

  // Hide or minimize when system maintains <= 0.75 Probability matching mentor constraints
  if (jointProb <= 0.75) return null;

  const impactMetrics = useMemo(() => {
    // 1. Customer Experience Risk
    const opsDrop = 100 - trustScores.operational;
    const engagementLoss = Math.max(0, Math.round(opsDrop * 0.35)); // 35% projection coefficient
    let cxRisk = "Omnichannel engagement nominal.";
    if (engagementLoss > 0) {
      if (trustScores.operational <= trustScores.performance) {
        cxRisk = `Display instability may reduce showroom engagement by ${engagementLoss}%`;
      } else {
        cxRisk = `Network latency likely to reduce interactive engagement by ${engagementLoss}%`;
      }
    }

    // 2. Operational Efficiency Impact
    const perfDrop = 100 - trustScores.performance;
    const efficiencyLoss = Math.max(0, Math.round(perfDrop * 0.45));
    const efficiencyImpact = efficiencyLoss > 0 ? `Routine baseline efficiency dropping by ${efficiencyLoss}%` : "Staff efficiency nominal.";

    // 3. Estimated Downtime & Prevented
    let downtime = "0 Minutes";
    let downtimePrevented = "0 Minutes";
    if (currentScore < 80) {
      downtime = `${Math.max(1, Math.round((80 - currentScore) * 0.5))} Minutes`;
      downtimePrevented = `${Math.max(45, Math.round((100 - currentScore) * 2.5))} Minutes`;
    }

    // 4. Severity Level
    let severity = 'Low';
    if (currentScore < 50) severity = 'Critical';
    else if (currentScore < 70) severity = 'Severe';
    else if (currentScore < 85) severity = 'Moderate';

    const getSeverityColor = (sev: string) => {
       if (sev === 'Critical') return 'text-red-500';
       if (sev === 'Severe') return 'text-orange-500';
       if (sev === 'Moderate') return 'text-yellow-400';
       return 'text-green-500';
    }

    return { cxRisk, efficiencyImpact, downtime, downtimePrevented, severity, severityColor: getSeverityColor(severity) };
  }, [currentScore, trustScores]);

  // Hide or minimize when system is perfectly healthy
  if (currentScore >= 95) {
    return (
      <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 mt-6 w-full opacity-60">
        <p className="text-gray-500 text-xs text-center">Business Impact: Nominal / Systems Stable</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-5 border border-red-900/30 mt-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
        <TrendingDown className="w-5 h-5 text-orange-400" />
        <h3 className="text-orange-400 text-sm font-bold tracking-wide">Business Impact Analysis</h3>
        <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border bg-black/40 ${impactMetrics.severityColor.replace('text-', 'border-').replace('500', '500/50')} ${impactMetrics.severityColor}`}>
          {impactMetrics.severity} Risk
        </span>
      </div>

      <div className="space-y-4">
        {/* Customer Experience block */}
        <div className="bg-black/40 border border-gray-800 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-400" />
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Customer Experience Risk</p>
          </div>
          <p className="text-gray-200 text-sm font-medium">{impactMetrics.cxRisk}</p>
        </div>

        {/* Operational Efficiency */}
        <div className="bg-black/40 border border-gray-800 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-400" />
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Operational Efficiency Impact</p>
          </div>
          <p className="text-gray-200 text-sm font-medium">{impactMetrics.efficiencyImpact}</p>
        </div>

        {/* Estimated Downtime */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 border border-red-900/20 rounded p-3 text-center">
            <div className="flex justify-center items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-red-500" />
              <p className="text-[10px] text-red-500 uppercase font-bold tracking-widest">Estimated Downtime</p>
            </div>
            <p className="text-red-400 font-extrabold text-2xl">{impactMetrics.downtime}</p>
            <p className="text-[10px] text-red-500/70 mt-1 uppercase font-bold">Projected blackout</p>
          </div>

          <div className="bg-green-950/20 border border-green-900/40 rounded p-3 text-center shadow-[0_0_15px_rgba(34,197,94,0.15)] relative overflow-hidden">
             <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>
             <div className="flex justify-center items-center gap-2 mb-1 relative">
               <Shield className="w-4 h-4 text-green-500" />
               <p className="text-[10px] text-green-500 uppercase font-bold tracking-widest">Downtime Prevented</p>
             </div>
             <p className="text-green-400 font-extrabold text-2xl relative">{impactMetrics.downtimePrevented}</p>
             <p className="text-[10px] text-green-500/70 mt-1 uppercase font-bold relative">Resolved by AI Insight</p>
          </div>
        </div>
      </div>
    </div>
  );
});
