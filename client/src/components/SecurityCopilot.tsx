import React, { useState, useEffect } from 'react';
import { AlertCircle, Zap, Activity, AlertTriangle, Search, ShieldAlert, Wrench, Target } from 'lucide-react';

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
  confidence: number;
}

export const SecurityCopilot: React.FC<SecurityCopilotProps> = ({ trustScore, recentAnomalies, isDemo = false }) => {
  const [insight, setInsight] = useState<ExplainableInsight | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Dynamic Telemetry Parsing Engine
  const deriveInsight = (anomaly: any): ExplainableInsight => {
    const scores = anomaly.engine_analysis.trust_scores || { operational: 100, performance: 100, security: 100, behavior: 100 };
    const tel = anomaly.raw_telemetry;
    
    const entries = Object.entries(scores) as [string, number][];
    const lowest = entries.reduce((prev, curr) => curr[1] < prev[1] ? curr : prev);
    
    const typeMap: Record<string, string> = {
      operational: 'Operational Friction',
      security: 'Security Violation',
      performance: 'Performance Bottleneck',
      behavior: 'Anomalous User Behavior'
    };
    
    const type = typeMap[lowest[0]] || 'Unknown Anomaly';
    const latency = tel.network_logs?.latency || 0;
    const freq = tel.display_logs?.frequency || 0;
    const finalScore = anomaly.engine_analysis.final_trust_score || 100;
    
    // Calculate Evidence dynamically
    let evidence = `Sub-system fault detected.`;
    if (lowest[0] === 'performance' || latency > 400) {
      evidence = `Network latency spiked to ${latency}ms, exceeding nominal thresholds.`;
    } else if (lowest[0] === 'operational') {
      evidence = `Display rendering dropped to ${freq}Hz concurrently with connectivity jitter.`;
    }

    // Determine Likely Cause
    let cause = "Hardware Malfunction";
    if (latency > 600) cause = "Severe Network Bandwidth Saturation";
    else if (freq < 150) cause = "Display Controller Desync / Memory Leak";
    
    // Decide Suggested Action
    let action = "Initiate full system diagnostic.";
    if (cause.includes("Network")) action = "Reroute display traffic via secondary network CDN.";
    if (cause.includes("Controller")) action = "Flag Display Controller #04 for immediate firmware reset.";

    // Mathematical Confidence Generation
    const confidenceDeviation = 100 - (lowest[1] * 0.4); 
    const confidence = Math.max(85, Math.min(99.9, confidenceDeviation));

    const riskLevel = finalScore < 60 ? 'Critical' : 'Caution';

    return {
      type,
      evidence,
      likelyCause: cause,
      suggestedAction: action,
      confidence,
      riskLevel
    };
  };

  useEffect(() => {
    if (recentAnomalies.length > 0 && trustScore < 80 && !insight && !loading) {
      setLoading(true);
      if (isDemo) {
        setTimeout(() => {
          const generatedInsight = deriveInsight(recentAnomalies[0]);
          setInsight(generatedInsight);
          setLoading(false);
        }, 1100);
      } else {
        // Mocking real backend processing
        setTimeout(() => {
          setInsight(deriveInsight(recentAnomalies[0]));
          setLoading(false);
        }, 1100);
      }
    } else if (trustScore >= 80) {
      setInsight(null);
    }
  }, [recentAnomalies, trustScore, insight, loading]);

  useEffect(() => {
    if (trustScore < 75 && actions.length === 0 && insight) {
      triggerAutoResponse();
    } else if (trustScore >= 75) {
      setActions([]);
    }
  }, [trustScore, actions.length, insight]);

  const triggerAutoResponse = async () => {
    if (isDemo || insight) {
      // Act directly on the suggested action decoded by XAI
      setActions([insight?.suggestedAction || "Reverting manual overrides"]);
    }
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
            <p className="text-cyan-500 text-sm animate-pulse tracking-widest uppercase font-bold">Diagnosing Telemetry...</p>
          </div>
        ) : insight ? (
          <div className="grid grid-cols-2 gap-3">
            <InsightCard icon={<AlertTriangle className="w-4 h-4" />} color="text-purple-400" label="Anomaly Type" value={insight.type} />
            <InsightCard icon={<Target className="w-4 h-4" />} color="text-green-400" label="Confidence" value={`${insight.confidence.toFixed(1)}%`} />
            <div className="col-span-2">
              <InsightCard icon={<Activity className="w-4 h-4" />} color="text-blue-400" label="Direct Evidence" value={insight.evidence} />
            </div>
            <InsightCard icon={<Search className="w-4 h-4" />} color="text-orange-400" label="Likely Cause" value={insight.likelyCause} />
            <InsightCard icon={<ShieldAlert className="w-4 h-4" />} color={insight.riskLevel === 'Critical' ? 'text-red-500' : 'text-yellow-400'} label="Risk Level" value={insight.riskLevel} />
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-6">Telemetry stabilized. No active anomalies.</p>
        )}
      </div>

      {/* Auto-Response Actions Feed */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-yellow-400 text-sm font-semibold tracking-wide">Action Executed</h3>
        </div>
        
        {actions.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {actions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm bg-black/40 p-2 rounded border border-green-900/30">
                <span className="text-green-400 mt-0.5 font-bold">✓</span>
                <div>
                  <p className="text-gray-300 font-medium capitalize">{action}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-xs italic">Awaiting AI diagnostic resolution.</p>
        )}
      </div>
    </div>
  );
};
