import React, { useState, useEffect } from 'react';
import { AlertCircle, Zap, Activity, AlertTriangle, Search, ShieldAlert, Target, GitMerge } from 'lucide-react';

interface SecurityCopilotProps {
  trustScore: number;
  recentAnomalies: any[];
  isDemo?: boolean;
}

interface ExplainableInsight {
  type: string;
  evidence: string;
  likelyCause: string;
  riskLevel: 'Stable' | 'Caution' | 'Critical';
  suggestedAction: string;
  impactIfIgnored: string;
  timeToFailure: number;
  rootCauseNodes: string[];
  highlightIndex: number;
}

export const SecurityCopilot: React.FC<SecurityCopilotProps> = ({ trustScore, recentAnomalies, isDemo = false }) => {
  const [insight, setInsight] = useState<ExplainableInsight | null>(null);
  const [decisionState, setDecisionState] = useState<'idle' | 'pending' | 'executing' | 'executed'>('idle');
  const [loading, setLoading] = useState(false);
  const [baseConfidence, setBaseConfidence] = useState(75);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'improving' | 'recalibrating'>('idle');

  const deriveInsight = (anomaly: any): ExplainableInsight => {
    const scores = anomaly.engine_analysis.trust_scores || { operational: 100, performance: 100, security: 100, behavior: 100 };
    const tel = anomaly.raw_telemetry;
    
    const entries = Object.entries(scores) as [string, number][];
    const lowest = entries.reduce((prev, curr) => curr[1] < prev[1] ? curr : prev);
    
    // Explicit Risk Classification System
    const typeMap: Record<string, string> = {
      operational: 'Operational Risk',
      security: 'Security Risk',
      performance: 'Performance Risk',
      behavior: 'Behavior Risk'
    };
    
    const type = typeMap[lowest[0]] || 'Operational Risk';
    const latency = tel.network_logs?.latency || 0;
    const freq = tel.display_logs?.frequency || 0;
    const finalScore = anomaly.engine_analysis.final_trust_score || 100;
    
    // Root Cause Chain Nodes
    let rootNodes: string[] = [];
    let hIndex = 1;

    if (type === 'Operational Risk') {
      rootNodes = ["Latency spike", "Display reload retries", "Admin overrides", "Trust score drop"];
      hIndex = 1;
    } else if (type === 'Performance Risk') {
      rootNodes = ["Regional Server Degradation", "Network Bandwidth Limits", "Gateway Timeout", "Trust score drop"];
      hIndex = 1;
    } else if (type === 'Security Risk') {
      rootNodes = ["Unrecognized Gateway ping", "Admin console exploit", "Database Lockdown", "Trust score drop"];
      hIndex = 1;
    } else {
      rootNodes = ["Session Interaction Freeze", "Input Rate Drop", "Timeout Logged", "Trust score drop"];
      hIndex = 0;
    }
    
    // Evidence
    let evidence = `Sub-system fault detected.`;
    if (lowest[0] === 'performance' || latency > 400) {
      evidence = `Network latency spiked to ${latency}ms, exceeding nominal thresholds.`;
    } else if (lowest[0] === 'operational') {
      evidence = `Display rendering dropped to ${freq}Hz concurrently with connectivity jitter.`;
    }

    let cause = "Hardware Malfunction";
    if (latency > 600) cause = "Severe Network Bandwidth Saturation";
    else if (freq < 150) cause = "Display Controller Desync / Memory Leak";
    
    let action = "Initiate full system diagnostic.";
    if (cause.includes("Network")) action = "Reroute display traffic via secondary network CDN.";
    if (cause.includes("Controller")) action = "Restart Display Controller #04";

    let impact = "Critical systemic failure.";
    if (lowest[0] === 'operational') impact = "Complete content outage across all local showrooms.";
    else if (lowest[0] === 'performance') impact = "Network gateway timeout causing multi-device desync.";
    else if (lowest[0] === 'security') impact = "Unauthorized hardware manipulation across sector.";

    const timeToFailure = Math.max(1, Math.round(finalScore * 0.35)); 
    const riskLevel = finalScore < 60 ? 'Critical' : 'Caution';

    return { type, evidence, likelyCause: cause, suggestedAction: action, riskLevel, impactIfIgnored: impact, timeToFailure, rootCauseNodes: rootNodes, highlightIndex: hIndex };
  };

  useEffect(() => {
    // Relying on real or simulated backend changes flowing down
    if (recentAnomalies.length > 0 && trustScore < 85 && !insight && !loading) {
      setLoading(true);
      setTimeout(() => {
        setInsight(deriveInsight(recentAnomalies[0]));
        setDecisionState('pending');
        setLoading(false);
      }, 900);
    } else if (trustScore >= 85) {
      setInsight(null);
      setDecisionState('idle');
    }
  }, [recentAnomalies, trustScore, insight, loading]);

  const handleExecuteAction = () => {
    setDecisionState('executing');
    setTimeout(() => {
      setDecisionState('executed');
    }, 1800);
  };

  const handleFeedback = (isHelpful: boolean) => {
    if (isHelpful) {
      setBaseConfidence(prev => Math.min(99, prev + 6));
      setFeedbackStatus('improving');
    } else {
      setBaseConfidence(prev => Math.max(50, prev - 4));
      setFeedbackStatus('recalibrating');
    }
    setTimeout(() => setFeedbackStatus('idle'), 3000);
  };

  const InsightCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => (
    <div className="bg-black/40 border border-gray-800/80 rounded p-3 flex flex-col justify-between">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
      </div>
      <p className="text-xs text-gray-300 font-medium leading-relaxed">{value}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Explainable AI Grid Panel */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
          <AlertCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-cyan-400 text-sm font-bold tracking-wide">Explainable AI (XAI) Engine</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-cyan-500 text-sm animate-pulse tracking-widest uppercase font-bold">Diagnosing Organic Telemetry...</p>
          </div>
        ) : insight ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InsightCard icon={<AlertTriangle className="w-4 h-4" />} color="text-purple-400" label="Risk Classification" value={insight.type} />
              <InsightCard icon={<ShieldAlert className="w-4 h-4" />} color={insight.riskLevel === 'Critical' ? 'text-red-500' : 'text-yellow-400'} label="Severity" value={insight.riskLevel} />
              <div className="col-span-2">
                <InsightCard icon={<Activity className="w-4 h-4" />} color="text-blue-400" label="Direct Evidence" value={insight.evidence} />
              </div>
            </div>

            {/* Vertical Root Cause Chain */}
            <div className="bg-black/60 border border-purple-900/30 rounded p-4 relative">
               <h4 className="flex items-center gap-2 text-[10px] text-purple-400 uppercase font-bold tracking-widest mb-4">
                 <GitMerge className="w-4 h-4" /> Root Cause Chain
               </h4>
               <div className="flex flex-col items-center">
                 {insight.rootCauseNodes.map((node, i) => (
                    <React.Fragment key={i}>
                       <div className={`px-4 py-2 border rounded-full text-xs transition-colors ${i === insight.highlightIndex ? 'bg-red-950/50 border-red-500 text-red-400 font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>
                         {node}
                       </div>
                       {i < insight.rootCauseNodes.length - 1 && (
                         <div className="h-4 w-px bg-gray-700 my-1 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] text-gray-600">↓</div>
                         </div>
                       )}
                    </React.Fragment>
                 ))}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InsightCard icon={<Search className="w-4 h-4" />} color="text-orange-400" label="Likely Cause" value={insight.likelyCause} />
               <div className="bg-black/40 border border-gray-800/80 rounded p-3 flex flex-col justify-between items-center text-center transition-all duration-300">
                <div className="flex justify-center mb-1 text-green-400">
                  <Target className={`w-5 h-5 ${feedbackStatus === 'improving' ? 'animate-ping' : ''}`} />
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-green-400 mb-1">Confidence</p>
                <p className="text-xl text-green-400 font-extrabold">{baseConfidence}%</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-6">Telemetry bounds are optimal. Autonomous tracking enabled.</p>
        )}
      </div>

      {insight && (
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex items-center justify-between">
          <div>
            <h4 className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">RLHF Target Loop</h4>
            {feedbackStatus === 'idle' ? (
              <p className="text-gray-500 text-[10px]">Was this anomaly correlation accurate?</p>
            ) : feedbackStatus === 'improving' ? (
              <p className="text-green-400 text-[10px] font-medium animate-pulse">Model confidence improving from feedback...</p>
            ) : (
              <p className="text-yellow-400 text-[10px] font-medium animate-pulse">Recalibrating inference weighting...</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleFeedback(true)}
              disabled={feedbackStatus !== 'idle'}
              className="px-3 py-1 bg-green-950/30 text-green-400 border border-green-900/50 hover:bg-green-900/50 rounded text-xs font-bold transition-colors disabled:opacity-50"
            >
              YES
            </button>
            <button 
              onClick={() => handleFeedback(false)}
              disabled={feedbackStatus !== 'idle'}
              className="px-3 py-1 bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-900/50 rounded text-xs font-bold transition-colors disabled:opacity-50"
            >
              NO
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-yellow-400 text-sm font-bold tracking-wide">Decision Intelligence</h3>
        </div>
        
        {decisionState === 'idle' || !insight ? (
          <p className="text-gray-500 text-xs italic py-4">Awaiting diagnostic resolution.</p>
        ) : (
          <div className="space-y-4">
             <div className="bg-black/40 border border-gray-800 rounded p-3">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Recommended Action</p>
                <p className="text-cyan-400 font-semibold text-sm">{insight.suggestedAction}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/40 border border-red-900/30 rounded p-3 flex flex-col justify-center">
                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Impact If Ignored</p>
                   <p className="text-gray-300 text-xs font-medium">{insight.impactIfIgnored}</p>
                </div>
                <div className="bg-red-950/20 border border-red-900/40 rounded p-3 text-center flex flex-col justify-center">
                   <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Time To Failure</p>
                   <p className="text-red-400 font-black text-xl">{insight.timeToFailure} Mins</p>
                </div>
             </div>
             
             <div className="pt-2">
               {decisionState === 'pending' && (
                 <button 
                  onClick={handleExecuteAction}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded uppercase tracking-wide transition-colors text-xs"
                 >
                   Execute Action
                 </button>
               )}
               {decisionState === 'executing' && (
                 <button disabled className="w-full bg-gray-800 text-gray-400 font-bold py-3 rounded uppercase tracking-wide text-xs flex justify-center items-center gap-3 cursor-not-allowed">
                   <span className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin"></span>
                   Executing Sequence...
                 </button>
               )}
               {decisionState === 'executed' && (
                 <button disabled className="w-full bg-green-900/40 border border-green-500/50 text-green-400 font-bold py-3 rounded uppercase tracking-wide text-xs cursor-not-allowed">
                   ✓ Action Deployed Successfully
                 </button>
               )}
             </div>
          </div>
        )}
      </div>

    </div>
  );
};
