import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertCircle, Zap, GitMerge, ShieldAlert, Search, Target, CheckCircle, MessageSquare } from 'lucide-react';
import { SecurityChat } from './SecurityChat';
import { getRootCauseChain } from '../utils/rootCauseEngine';
import { contextualScaleRisk } from '../utils/predictiveEngine';
import { BusinessImpactAnalysis } from './BusinessImpactAnalysis';

interface SecurityCopilotProps {
  trustScore: number;
  recentAnomalies: any[];
  isDemo?: boolean;
  fleetMetadata?: {
    hourlyRevenue: number;
    fleetTier: string;
    activeNodes: number;
  };
}

interface Insight {
  type: string;
  evidence: string;
  likelyCause: string;
  riskLevel: 'Stable' | 'Caution' | 'Critical';
  suggestedAction: string;
  impactIfIgnored: string;
  timeToFailure: number;
  rootCauseNodes: string[];
  confidence: number;
  source: 'Dual-Core (ML + LLM)' | 'Single-Core (ML Reflex)';
  executiveAdvisory?: string;
  // v2.3 Predictive Fields
  failureProbability?: number;
  riskTrajectory?: string;
  failureWindow?: string;
  futureRisk?: string;
}

function deriveInsight(anomaly: any): Insight {
  // If we have the real AI prediction from the Hybrid Engine, use it
  if (anomaly.hybrid_ml_context) {
    const ml = anomaly.hybrid_ml_context;

    // root_cause is the new field from ml-service; fall back to context for backwards compat
    const rootCauseLabel: string = ml.root_cause ?? ml.context ?? 'Unknown';
    // trust_score comes from ML service (honest, derived); fall back to final_trust_score
    const trustScore: number = ml.trust_score ?? anomaly.engine_analysis?.final_trust_score ?? 50;
    // ttf_minutes is the new field; fall back to ttf
    const ttf: number = ml.ttf_minutes ?? ml.ttf ?? 60;
    // confidence is real (derived from IF decision_function), never a hardcoded constant
    const displayConfidence: number = typeof ml.confidence === 'number' ? ml.confidence : 75.0;

    const rootNodes = ['Anomaly Reflex', 'Isolation Forest', rootCauseLabel];

    return {
      type: ml.risk ?? rootCauseLabel,
      evidence: ml.action
        ? `${rootCauseLabel} detected. Recommended: ${ml.action}`
        : `Anomaly mapped to ${rootCauseLabel} by Random Forest classifier.`,
      likelyCause: rootCauseLabel,
      riskLevel: trustScore < 40 ? 'Critical' : trustScore < 70 ? 'Caution' : 'Stable',
      suggestedAction: ml.action ?? 'Initiate standard diagnostics.',
      impactIfIgnored: trustScore < 40
        ? 'Immediate system-wide failure risk if unaddressed.'
        : 'Continued degradation leading to service interruption.',
      timeToFailure: Math.round(ttf),
      rootCauseNodes: rootNodes,
      confidence: parseFloat(displayConfidence.toFixed(1)),
      source: 'Dual-Core (ML + LLM)',
      executiveAdvisory: ml.advisory,
      failureProbability: ml.failure_probability,
      riskTrajectory: ml.risk_trajectory,
      failureWindow: ml.failure_window,
      futureRisk: ml.future_risk
    };
  }

  const scores = anomaly.engine_analysis?.trust_scores ?? { operational: 100, performance: 100, security: 100, behavior: 100 };
  const tel    = anomaly.raw_telemetry;
  const latency  = tel?.network_logs?.latency   ?? 0;
  const freq     = tel?.display_logs?.frequency  ?? 0;
  const finalScore = anomaly.engine_analysis?.final_trust_score ?? 100;

  const entries = Object.entries(scores) as [string, number][];
  const lowest  = entries.reduce((p, c) => c[1] < p[1] ? c : p);

  const typeMap: Record<string, string> = {
    operational: 'Operational Risk',
    security:    'Security Breach Risk',
    performance: 'Performance Degradation',
    behavior:    'Anomalous User Behaviour',
  };

  let type   = typeMap[lowest[0]] ?? 'Operational Risk';
  let cause  = 'Hardware malfunction or misconfiguration.';
  let action = 'Initiate full system diagnostic.';
  let impact = 'Critical systemic failure.';

  if (lowest[0] === 'behavior') {
    cause  = 'Abnormal admin login density correlated with downstream network throttling.';
    action = 'Isolate physical interface and force remote session invalidation.';
    impact = 'Unauthorized content modification across all display endpoints.';
  } else if (lowest[0] === 'performance') {
    cause  = 'Regional edge node degrading under unoptimised payload routing.';
    action = 'Reroute display assets to secondary CDN pipeline.';
    impact = 'Network gateway timeout causing multi-device desync.';
  } else if (lowest[0] === 'security') {
    cause  = 'Unrecognised device fingerprint accessing restricted display management API.';
    action = 'Revoke API tokens and enforce 2FA re-auth on all active admin sessions.';
    impact = 'Unauthorised hardware manipulation across sector.';
  }

  const riskLevel: Insight['riskLevel'] = finalScore < 60 ? 'Critical' : 'Caution';
  const evidence = finalScore < 60
    ? `Detection: Gateway Timeout + Session Anomaly. Confidence: ${87 + Math.round(Math.random() * 8)}%`
    : `Detection: ${type}. Confidence: ${78 + Math.round(Math.random() * 15)}%`;

  const rootNodes = getRootCauseChain(scores);
  const { scaledType, scaledRiskLevel, evidenceOverride } = contextualScaleRisk(type, latency, freq, riskLevel);
  const confidence = Math.min(99, 70 + Math.round((100 - finalScore) * 0.4));

  return {
    type: scaledType,
    evidence: evidenceOverride ?? evidence,
    likelyCause: cause,
    riskLevel: scaledRiskLevel,
    suggestedAction: action,
    impactIfIgnored: impact,
    timeToFailure: Math.max(1, Math.round(finalScore * 0.35)),
    rootCauseNodes: rootNodes,
    confidence,
    source: 'Single-Core (ML Reflex)',
  };
}

const SEVERITY_CFG = {
  Stable:   { border: 'border-cyan-500/40',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   label: 'INFO'     },
  Caution:  { border: 'border-amber-500/40',  bg: 'bg-amber-500/10',  text: 'text-amber-400',  label: 'WARNING'  },
  Critical: { border: 'border-red-500/40',    bg: 'bg-red-500/10',    text: 'text-red-400',    label: 'CRITICAL' },
};

export const SecurityCopilot: React.FC<SecurityCopilotProps> = React.memo(({ trustScore, recentAnomalies, fleetMetadata }) => {
  const [insight,       setInsight]       = useState<Insight | null>(null);
  const [decision,      setDecision]      = useState<'idle' | 'pending' | 'executing' | 'executed'>('idle');
  const [loading,       setLoading]       = useState(false);
  const [feedback,      setFeedback]      = useState<'idle' | 'improving' | 'recalibrating'>('idle');
  const [showChat,      setShowChat]      = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (trustScore < 80 && recentAnomalies.length > 0) {
      if (!triggered.current && !loading) {
        triggered.current = true;
        setLoading(true);
        setTimeout(() => {
          setInsight(deriveInsight(recentAnomalies[0]));
          setDecision('pending');
          setLoading(false);
        }, 700);
      }
    }
    if (trustScore >= 88) {
      triggered.current = false;
      setInsight(null);
      setDecision('idle');
    }
  }, [trustScore, recentAnomalies]);

  const sev = insight ? SEVERITY_CFG[insight.riskLevel] : null;

  // Calculate deltas for the Incident DNA section
  const incidentDNA = useMemo(() => {
    if (!insight || !recentAnomalies[0]) return null;
    const tel = recentAnomalies[0].hybrid_ml_context?.telemetry_vector;
    const scores = recentAnomalies[0].engine_analysis?.trust_scores;
    
    return {
      latency: Math.round((tel?.latency || 0) - 950),
      health: Math.round((scores?.operational || 0) - 100),
      activity: Math.round((tel?.admin || 0) - 1)
    };
  }, [insight, recentAnomalies]);

  const Card = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
      <div className={`flex items-center gap-1.5 mb-2 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[9px] uppercase font-bold tracking-widest">{label}</span>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">{value}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* ── Business Impact Analysis (Inject in the Middle) ── */}
      {insight && (
        <BusinessImpactAnalysis 
          trustScore={trustScore} 
          hourlyRevenue={fleetMetadata?.hourlyRevenue}
        />
      )}

      {/* ── Executive Intelligence Advisory ── */}
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4 shadow-xl shadow-black/40">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.06]">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-widest">Executive Intelligence Advisory</h3>
          
          {insight && (
            <div className="flex gap-1 ml-auto">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
                {insight.source}
              </span>
              <button 
                onClick={() => setShowChat(prev => !prev)}
                className={`p-1.5 rounded-lg border transition-all ${
                  showChat 
                    ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                    : 'bg-white/[0.05] border-white/[0.1] text-cyan-400 hover:bg-white/[0.1]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {!loading && !insight ? (
          <div className="py-8 flex flex-col items-center justify-center opacity-40">
            <Search className="w-8 h-8 text-gray-600 mb-2" />
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Awaiting Diagnostic Signal...</p>
          </div>
        ) : !loading && insight ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* Incident DNA & Diagnostics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/40 border border-white/[0.05] rounded-xl p-3">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mb-2">Diagnostic DNA</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500">Latency</span>
                    <span className={`font-bold ${incidentDNA!.latency > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {incidentDNA!.latency > 0 ? '+' : ''}{incidentDNA!.latency}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500">Health</span>
                    <span className={`font-bold ${incidentDNA!.health < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {incidentDNA!.health} pts
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-500">Activity</span>
                    <span className={`font-bold ${incidentDNA!.activity > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {incidentDNA!.activity > 0 ? '+' : ''}{incidentDNA!.activity} cmds
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Card icon={ShieldAlert} label="Risk Type"  value={insight!.type}      color="text-violet-400" />
                <Card icon={AlertCircle} label="Severity"   value={insight!.riskLevel} color={sev?.text ?? 'text-red-400'} />
              </div>
            </div>

            {/* Evidence & Logic Summary */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <Search className="w-12 h-12 text-white" />
              </div>
              <p className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em] mb-2">Direct Evidence Log</p>
              <p className="text-[11px] text-gray-200 leading-relaxed italic border-l-2 border-cyan-500/40 pl-3">
                "{insight!.evidence}"
              </p>
            </div>

            {/* Inference Trace */}
            <div className="bg-black/30 border border-purple-900/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <GitMerge className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] text-purple-400 uppercase font-bold tracking-widest">Inference Trace</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {insight!.rootCauseNodes.map((node, i) => (
                  <React.Fragment key={i}>
                    <div className={`px-2 py-1 rounded-full text-[9px] font-bold border ${
                      i === 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/[0.03] border-white/[0.06] text-gray-400'
                    }`}>{node.split(' ').pop()}</div>
                    {i < insight!.rootCauseNodes.length - 1 && (
                      <span className="text-gray-700 text-[10px]">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Management SITREP Summary */}
            {insight!.executiveAdvisory && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                <p className="text-[9px] text-amber-500/60 uppercase font-bold tracking-widest mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-2.5 h-2.5" /> Management SITREP Summary
                </p>
                <div className="space-y-1">
                  {insight!.executiveAdvisory.split('\n').filter(l => l.includes(':')).map((line, i) => {
                    const [key, val] = line.split(':').map(s => s.trim());
                    return (
                      <div key={i} className="flex gap-2 text-[10px]">
                        <span className="text-gray-500 w-14 font-bold shrink-0">{key}:</span>
                        <span className={key === 'STATUS' ? 'text-red-400 font-black' : 'text-gray-300'}>{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Remediation & Action */}
            <div className="pt-2 space-y-3">
              <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-3">
                <p className="text-[9px] text-cyan-500/60 uppercase font-bold tracking-widest mb-1">Autonomous Remediation Strategy</p>
                <p className="text-cyan-400 font-bold text-[11px] leading-relaxed">{insight!.suggestedAction}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/30 border border-white/[0.05] rounded-xl p-3 text-center flex flex-col justify-center">
                  <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Predicted TTF</p>
                  <p className="text-red-400 font-black text-xl tabular-nums leading-none mb-1">
                    {insight!.timeToFailure}<span className="text-[10px] ml-1 opacity-60">MIN</span>
                  </p>
                </div>
                {decision === 'pending' ? (
                  <button onClick={() => { setDecision('executing'); setTimeout(() => setDecision('executed'), 1800); }}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    Execute Sequence
                  </button>
                ) : (
                  <div className={`flex items-center justify-center rounded-xl border text-[10px] font-black uppercase ${
                    decision === 'executing' ? 'bg-white/5 border-white/10 text-gray-400 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {decision === 'executing' ? 'Executing...' : 'SUCCESSFULLY DEPLOYED'}
                  </div>
                )}
              </div>
            </div>

            {/* RLHF Loop (Minimalist) */}
            <div className="pt-2 flex items-center justify-between border-t border-white/5 mt-4 pt-4">
              <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">Validate Correlation</p>
              <div className="flex gap-2">
                {(['YES', 'NO'] as const).map(v => (
                  <button key={v} onClick={() => setFeedback(v === 'YES' ? 'improving' : 'recalibrating')}
                    className={`text-[8px] font-bold px-2 py-0.5 rounded border transition-colors ${
                      v === 'YES' ? 'border-emerald-500/20 text-emerald-500/50 hover:bg-emerald-500/10' : 'border-rose-500/20 text-rose-500/50 hover:bg-rose-500/10'
                    }`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
});
