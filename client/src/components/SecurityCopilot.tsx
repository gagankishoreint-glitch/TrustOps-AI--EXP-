import React, { useState, useEffect } from 'react';
import { AlertCircle, Zap } from 'lucide-react';

interface SecurityCopilotProps {
  trustScore: number;
  recentAnomalies: any[];
  isDemo?: boolean;
}

export const SecurityCopilot: React.FC<SecurityCopilotProps> = ({ trustScore, recentAnomalies, isDemo = false }) => {
  const [explanation, setExplanation] = useState<string>('');
  const [actions, setActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch risk explanation when anomalies are detected
  useEffect(() => {
    // Only fetch if we haven't already fetched the explanation, to prevent flashing
    if (recentAnomalies.length > 0 && trustScore < 80 && !explanation && !loading) {
      fetchRiskExplanation();
    } else if (trustScore >= 80) {
      setExplanation(''); // Reset when healthy
    }
  }, [recentAnomalies, trustScore, explanation, loading]);

  // Trigger auto-response when trust score drops below 75
  useEffect(() => {
    if (trustScore < 75 && actions.length === 0) {
      triggerAutoResponse();
    } else if (trustScore >= 75) {
      setActions([]);
    }
  }, [trustScore, actions.length]);

  const fetchRiskExplanation = async () => {
    try {
      setLoading(true);
      if (isDemo) {
        // Mock GenAI response for presentation using multi-scores
        setTimeout(() => {
          setExplanation("GenAI Insight: Final Trust dropped to 58. Operational Trust severely degraded (down to 40) due to display system instability. Performance Trust fell (down to 50) due to correlated spikes in network latency. System is experiencing major operational friction, not a security breach.");
          setLoading(false);
        }, 1200);
        return;
      }
      const response = await fetch('http://127.0.0.1:8000/api/v1/explain-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: recentAnomalies.slice(0, 5) })
      });
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Failed to fetch risk explanation:', error);
      setExplanation('Unable to fetch risk analysis at this time.');
    } finally {
      if (!isDemo) setLoading(false);
    }
  };

  const triggerAutoResponse = async () => {
    try {
      if (isDemo) {
        setActions(prev => ["Flagged Display Controller #04 for maintenance", "Reverting manual admin overrides", "Notifying regional operational manager"].slice(0, 10));
        return;
      }
      const response = await fetch('http://127.0.0.1:8000/api/v1/auto-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trust_score: trustScore })
      });
      const data = await response.json();
      if (data.actions_taken.length > 0) {
        setActions(prev => [...data.actions_taken, ...prev].slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to trigger auto-response:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Risk Explanation Panel */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-cyan-400 text-sm font-semibold">Security Copilot</h3>
        </div>
        
        {loading ? (
          <p className="text-gray-400 text-sm animate-pulse">Analyzing...</p>
        ) : explanation ? (
          <p className="text-gray-300 text-sm leading-relaxed">{explanation}</p>
        ) : (
          <p className="text-gray-500 text-sm">Monitoring operational health...</p>
        )}
      </div>

      {/* Cross-System Anomaly Correlation */}
      {recentAnomalies.length > 0 && recentAnomalies[0]?.engine_analysis?.correlation_engine && (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-3 border-b border-gray-800 pb-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <h3 className="text-purple-400 text-sm font-semibold">Anomaly Correlator</h3>
            <span className="ml-auto text-xs font-bold text-green-400 bg-green-950/30 px-2 py-0.5 rounded border border-green-500/40">
              {recentAnomalies[0].engine_analysis.correlation_engine.confidence_score}% Confidence
            </span>
          </div>
          
          <div className="mb-4 mt-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Correlated Signals</p>
            <div className="flex flex-wrap gap-2">
               {recentAnomalies[0].engine_analysis.correlation_engine.correlated_signals.map((sig: string, i: number) => (
                  <span key={i} className="text-xs bg-purple-950/40 text-purple-300 border border-purple-500/30 px-2 py-1 rounded">
                    {sig}
                  </span>
               ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Root Cause Chain</p>
            <div className="bg-black/40 p-3 rounded border border-gray-800/80">
              <p className="text-xs text-gray-300 flex items-center flex-wrap gap-1">
                {recentAnomalies[0].engine_analysis.correlation_engine.root_cause_chain.split('→').map((node: string, i: number, arr: string[]) => (
                  <React.Fragment key={i}>
                    <span className="font-semibold text-gray-200">{node.trim()}</span>
                    {i < arr.length - 1 && <span className="text-cyan-500 font-bold px-1">→</span>}
                  </React.Fragment>
                ))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Response Actions Feed */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-yellow-400 text-sm font-semibold">Auto-Response Actions</h3>
        </div>
        
        {actions.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {actions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-green-400 mt-1">✓</span>
                <div>
                  <p className="text-gray-300 capitalize">{action}</p>
                  <p className="text-gray-500 text-xs">Status: Executed</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No actions triggered. System operating normally.</p>
        )}
      </div>

      {/* Status Indicator */}
      <div className={`rounded-lg p-3 border ${trustScore < 75 ? 'border-red-500 bg-red-950/20' : 'border-cyan-400 bg-cyan-950/20'}`}>
        <p className={`text-xs font-semibold ${trustScore < 75 ? 'text-red-400' : 'text-cyan-400'}`}>
          {trustScore < 75 ? 'CRITICAL: Intervention Required' : 'System Status: Healthy'}
        </p>
      </div>
    </div>
  );
};
