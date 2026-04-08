import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { TrustScoreGauge } from '@/components/TrustScoreGauge';
import { TelemetryCharts } from '@/components/TelemetryCharts';
import { SecurityCopilot } from '@/components/SecurityCopilot';
import { MultiScoreDisplay, TrustScores } from '@/components/MultiScoreDisplay';
import { PredictiveTimeline } from '@/components/PredictiveTimeline';
import { BusinessImpactAnalysis } from '@/components/BusinessImpactAnalysis';
import { FleetView } from '@/components/FleetView';
import { useShowroomStore } from '@/store/useShowroomStore';
import { ModelInspector } from '@/components/ModelInspector';

// --- Single source of truth types ---
export interface TelemetryPoint {
  timestamp: number;
  latency: number;
  frequency: number;
}

interface StreamPayload {
  raw_telemetry: {
    display_logs: { content_id: string; play_time: number; frequency: number };
    admin_actions: { login_time: string; content_change: boolean; device_access: string };
    network_logs: { packets: number; latency: number; bandwidth: number };
    behavior_logs: { session_duration: number; interaction_count: number };
  };
  engine_analysis: {
    is_anomalous: boolean;
    anomaly_severity: number;
    trust_scores: TrustScores;
    final_trust_score: number;
    status: string;
  };
  hybrid_ml_context?: any;
}

// Gaussian noise for organic jitter
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdev + mean;
}

export default function Home() {
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  // Derived from URL query parameter ?demo=true/false
  const isDemo = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') !== 'false'; // Default to true for easy pitching
  }, []);

  // === SINGLE REACTIVE STATE — everything derives from this ===
  const [trustScore, setTrustScore] = useState(100);
  const [trustScores, setTrustScores] = useState<TrustScores>({
    operational: 100, security: 100, behavior: 100, performance: 100
  });
  const [telemetryWindow, setTelemetryWindow] = useState<TelemetryPoint[]>(
    Array.from({ length: 20 }, (_, i) => ({
      timestamp: Date.now() - (20 - i) * 1000,
      latency: 900 + Math.random() * 100,
      frequency: 490 + Math.random() * 20
    }))
  );
  const [recentAnomalies, setRecentAnomalies] = useState<StreamPayload[]>([]);
  const [predictedTTF, setPredictedTTF] = useState<number | null>(null);

  const anomalyEngine = useRef<{ active: boolean; type: string; tick: number }>({
    active: false, type: '', tick: 0
  });
  const latencyRef = useRef(950);

  const { updateShowroomScore } = useShowroomStore();

  // Compute avg latency from the rolling window
  const avgLatency = useMemo(() => {
    if (telemetryWindow.length === 0) return 0;
    return telemetryWindow.reduce((a, b) => a + b.latency, 0) / telemetryWindow.length;
  }, [telemetryWindow]);

  // === REACTIVE TRUST ENGINE ===
  // Trust score is strictly derived from live telemetry — no separate calculation needed
  const reactiveTrustScores = useMemo((): TrustScores => {
    const latestPoint = telemetryWindow[telemetryWindow.length - 1];
    if (!latestPoint) return trustScores;

    const { latency, frequency } = latestPoint;

    // Performance score reacts directly to latency (Industry Standard)
    let performance = trustScores.performance;
    if (latency > 1500) performance = Math.round(10 + Math.random() * 10);      // FAILURE
    else if (latency > 1000) performance = Math.round(35 + Math.random() * 15); // CRITICAL
    else if (latency > 700) performance = Math.round(65 + Math.random() * 10);  // DEGRADED
    else performance = Math.min(100, Math.round(92 + Math.random() * 8));

    // Operational score reacts to frequency
    let operational = trustScores.operational;
    if (frequency < 100) operational = Math.round(20 + Math.random() * 15);
    else if (frequency < 300) operational = Math.round(55 + Math.random() * 15);
    else if (frequency < 450) operational = Math.round(78 + Math.random() * 8);
    else operational = Math.min(100, Math.round(94 + Math.random() * 6));

    return {
      operational,
      performance,
      security: trustScores.security,
      behavior: trustScores.behavior,
    };
  }, [telemetryWindow, trustScores]);

  const reactiveTrustScore = useMemo(() => {
    const { operational, security, performance, behavior } = reactiveTrustScores;
    const base = Math.round(operational * 0.3 + security * 0.3 + performance * 0.2 + behavior * 0.2);
    // SAFETY FLOOR: If performance is critical, the score MUST reflect a crisis
    if (performance < 50) return Math.min(55, base);
    if (performance < 75) return Math.min(78, base);
    return base;
  }, [reactiveTrustScores]);

  // Sync reactive score to Zustand global fleet state
  useEffect(() => {
    if (activeLocation) {
      updateShowroomScore(activeLocation, reactiveTrustScore);
    }
  }, [reactiveTrustScore, activeLocation, updateShowroomScore]);

  // === MAIN TELEMETRY LOOP — single engine, single interval ===
  useEffect(() => {
    setIsConnected(true);

    if (!isDemo) {
      // Live backend SSE
      const eventSource = new EventSource('http://127.0.0.1:8000/api/v1/stream');
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onmessage = (event) => {
        try {
          const payload: StreamPayload = JSON.parse(event.data);
          const { latency, frequency } = payload.raw_telemetry
            ? { latency: payload.raw_telemetry.network_logs.latency, frequency: payload.raw_telemetry.display_logs.frequency }
            : { latency: 950, frequency: 500 };

          setTelemetryWindow(prev => [...prev.slice(-19), { timestamp: Date.now(), latency, frequency }]);
          setTrustScores(payload.engine_analysis.trust_scores);
          setTrustScore(payload.engine_analysis.final_trust_score);
          if (payload.engine_analysis.is_anomalous) {
            setRecentAnomalies(prev => [payload, ...prev].slice(0, 10));
          }
        } catch {}
      };
      eventSource.onerror = () => { setIsConnected(false); eventSource.close(); };
      return () => eventSource.close();
    }

    // Demo Mode: single 1s tick drives everything
    const interval = setInterval(() => {
      const engine = anomalyEngine.current;

      // Anomaly engine state management
      if (engine.active) {
        engine.tick -= 1;
        if (engine.tick <= 0) {
          engine.active = false;
          latencyRef.current = 950; // Reset
        }
      } else if (Math.random() < 0.04) {
        engine.active = true;
        engine.tick = 30;
        const types = ['behavior', 'behavior', 'operational', 'performance'];
        engine.type = types[Math.floor(Math.random() * types.length)];
      }

      const isAttack = engine.active;
      const currentTick = engine.tick;

      // === Generate raw telemetry from the engine state ===
      let latency: number;
      let frequency: number;
      let ops = Math.round(gaussianRandom(98, 1));
      let sec = Math.round(gaussianRandom(97, 1.5));
      let perf = Math.round(gaussianRandom(96, 2));
      let behav = Math.round(gaussianRandom(99, 0.5));

      if (isAttack) {
        const type = engine.type;

        if (type === 'behavior') {
          behav = Math.round(30 + Math.random() * 20);
          // Cascade into performance after tick 20
          if (currentTick < 20) {
            // Random walk latency upward toward FAILURE
            latencyRef.current = Math.min(2600, latencyRef.current + (80 + Math.random() * 120));
            perf = Math.round(15 + Math.random() * 15);
            ops = Math.round(45 + Math.random() * 15);
          } else {
            // Slower recovery
            latencyRef.current = Math.max(950, latencyRef.current - 50);
          }
        } else if (type === 'performance') {
          // Violent latency spike
          latencyRef.current = Math.min(2600, latencyRef.current + (150 + Math.random() * 200));
          perf = Math.round(10 + Math.random() * 20);
        } else {
          ops = Math.round(40 + Math.random() * 20);
          latencyRef.current = Math.round(gaussianRandom(950, 15));
        }

        frequency = Math.max(10, Math.round(500 - (latencyRef.current * 0.22)));
      } else {
        // Slow organic recovery instead of instant reset
        if (latencyRef.current > 1000) {
          latencyRef.current -= (40 + Math.random() * 60);
        } else {
          latencyRef.current = Math.round(gaussianRandom(950, 15));
        }
        frequency = Math.round(gaussianRandom(500, 5));
      }

      latency = Math.round(latencyRef.current);
      frequency = Math.max(0, Math.round(frequency!));

      // Clamp sub-scores 0-100 for visual spider chart
      ops = Math.min(100, Math.max(0, ops));
      sec = Math.min(100, Math.max(0, sec));
      perf = Math.min(100, Math.max(0, perf));
      behav = Math.min(100, Math.max(0, behav));

      // Synthesize CPU and Admin actions to pass to ML Engine based on latency
      const simulatedCpu = Math.min(100, (latency / 20) + 10);
      const simulatedAdmin = engine.type === 'behavior' ? Math.round(5 + Math.random() * 10) : (latency > 800 ? 3 : 1);

      // ASYNC CALL TO HYBRID ENGINE
      fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latency, cpu: simulatedCpu, adminCount: simulatedAdmin })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.result) return;
        const analysis = data.result;

        setTelemetryWindow(prev => [...prev.slice(-19), { timestamp: Date.now(), latency, frequency }]);
        setTrustScores({ operational: ops, security: sec, performance: perf, behavior: behav });
        setTrustScore(analysis.trust_score);
        setPredictedTTF(analysis.is_anomaly ? analysis.ttf : null);

        if (analysis.is_anomaly) {
          // Add to Global History
          useShowroomStore.getState().addHistoryEvent({
            timestamp: new Date().toISOString(),
            location: activeLocation || 'Fleet Layer',
            event: analysis.context,
            impact: analysis.trust_score < 60 ? 'Critical Disruption' : 'Moderate Disruption',
            status: 'Action Required',
            severity: analysis.trust_score < 60 ? 'High' : 'Medium'
          });

          const payload = {
            raw_telemetry: {
              display_logs: { content_id: 'display-01', play_time: 120, frequency },
              admin_actions: { login_time: new Date().toISOString(), content_change: false, device_access: 'anomalous' },
              network_logs: { packets: 15000, latency, bandwidth: 100 },
              behavior_logs: { session_duration: 300, interaction_count: simulatedAdmin },
            },
            engine_analysis: {
              is_anomalous: true,
              anomaly_severity: 8,
              trust_scores: { operational: ops, security: sec, performance: perf, behavior: behav },
              final_trust_score: analysis.trust_score,
              status: 'Autonomous Anomaly Detected',
            },
            // Include our ML context directly
            hybrid_ml_context: analysis
          } as StreamPayload & { hybrid_ml_context?: any };
          setRecentAnomalies(prev => [payload, ...prev].slice(0, 10));
        } else {
          // Clear anomalies when recovered
          if (analysis.trust_score > 85) setRecentAnomalies([]);
        }
      })
      .catch(err => {
        console.error("Hybrid Engine Refused. Is the Express server running?", err);
        // Fallback to organic
        setTelemetryWindow(prev => [...prev.slice(-19), { timestamp: Date.now(), latency, frequency }]);
        const finalWeighted = Math.round(ops * 0.3 + sec * 0.3 + perf * 0.2 + behav * 0.2);
        setTrustScore(finalWeighted);
        setPredictedTTF(finalWeighted < 80 ? Math.round((finalWeighted - 30) / 1.8) : null);
      });

    }, 800);

    return () => clearInterval(interval);
  }, [isDemo]);

  // Shift+D Executive override
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'D' && e.shiftKey) {
        setManualOverride(true);
        anomalyEngine.current = { active: true, tick: 15, type: 'behavior' };
        latencyRef.current = 950;
      }
      if (e.key === 'i' && e.ctrlKey) {
        setShowInspector(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCritical = reactiveTrustScore < 60;
  const isWarning = reactiveTrustScore < 80;

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col" style={{ background: '#080c14', color: '#e2e8f0' }}>

      {/* ── HEADER ── */}
      <header className="shrink-0 z-50 px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(8,12,20,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>

        <div className="flex items-center gap-4">
          {activeLocation && (
            <button
              onClick={() => { setActiveLocation(null); setManualOverride(false); }}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#00d4ff' }}
            >
              ← Fleet
            </button>
          )}
          <div>
            <h1 className="text-lg font-black tracking-tight" style={{ color: '#00d4ff', lineHeight: 1 }}>
              TrustOps AI
              {activeLocation && (
                <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.9rem' }}>
                  &nbsp;/&nbsp;{activeLocation}
                </span>
              )}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#334155' }}>
              Decision Intelligence Layer
              {isDemo && <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>· DEMO</span>}
              {manualOverride && activeLocation && (
                <span style={{ color: '#ef4444', marginLeft: '0.5rem' }} className="animate-pulse">· MANUAL OVERRIDE</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeLocation && avgLatency > 0 && (
            <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg"
              style={{
                background: avgLatency > 1200 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${avgLatency > 1200 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: avgLatency > 1200 ? '#ef4444' : '#64748b'
              }}>
              {Math.round(avgLatency)} ms
            </div>
          )}
          <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2"
            style={{
              background: isCritical ? 'rgba(239,68,68,0.08)' : isWarning ? 'rgba(245,158,11,0.08)' : 'rgba(0,212,255,0.06)',
              border: `1px solid ${isCritical ? 'rgba(239,68,68,0.4)' : isWarning ? 'rgba(245,158,11,0.35)' : 'rgba(0,212,255,0.3)'}`,
              color: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#00d4ff',
            }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#00d4ff' }} />
            {isCritical ? 'Critical' : isWarning ? 'Degraded' : 'Live'}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {!activeLocation ? (
          <div className="h-full overflow-y-auto">
            <FleetView 
              onSelectShowroom={setActiveLocation} 
              isDemo={isDemo} 
              recentAnomalies={recentAnomalies}
            />
          </div>
        ) : (
          <div className="h-full grid grid-cols-3" style={{ gap: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}>

            {/* ── Col 1: TELEMETRY ── */}
            <div className="flex flex-col min-h-0" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="shrink-0 px-4 pt-4 pb-2">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#334155' }}>Live Telemetry</p>
              </div>
              <div className="flex-1 min-h-0">
                <TelemetryCharts data={telemetryWindow} />
              </div>
              <div className="shrink-0 p-4 border-t border-white/5 flex gap-4">
                <div className="flex-1 min-h-0 bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Avg Latency</p>
                  <p className="text-xl font-black text-cyan-400">{avgLatency.toFixed(1)} ms</p>
                </div>
                <div className="flex-1 min-h-0 bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Peak Frequency</p>
                  <p className="text-xl font-black text-purple-400">{telemetryWindow[telemetryWindow.length - 1]?.frequency.toFixed(1)} Hz</p>
                </div>
              </div>
            </div>

            {/* ── Col 2: TRUST ENGINE ── */}
            <div className="flex flex-col min-h-0 p-4 gap-3 overflow-y-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="shrink-0 rounded-2xl p-4 flex flex-col items-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: '#334155' }}>Composite Trust Score</p>
                <TrustScoreGauge score={reactiveTrustScore} />
              </div>
              <div className="shrink-0 rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <MultiScoreDisplay scores={reactiveTrustScores} />
              </div>
              <div className="shrink-0">
                <PredictiveTimeline 
                  currentScore={reactiveTrustScore} 
                  trustScores={reactiveTrustScores} 
                  predictedTTF={predictedTTF}
                  isDemo={isDemo} 
                />
              </div>
            </div>

            {/* ── Col 3: INTELLIGENCE ── */}
            <div className="flex flex-col min-h-0 p-4 gap-3 overflow-y-auto">
              <SecurityCopilot
                trustScore={reactiveTrustScore}
                recentAnomalies={recentAnomalies}
                isDemo={isDemo}
              />
            </div>

          </div>
        )}
      </main>

      {/* Model Inspector Verification Tool (Ctrl + I) */}
      <ModelInspector 
        isOpen={showInspector} 
        onClose={() => setShowInspector(false)} 
        rawMLData={recentAnomalies[0]?.hybrid_ml_context || recentAnomalies[0]?.engine_analysis}
      />
    </div>
  );
}
