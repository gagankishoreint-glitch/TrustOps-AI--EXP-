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
import { analyzeTelemetry, type TelemetryData, type AnalysisResult } from '@/lib/api';

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

  const isDemo = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') !== 'false';
  }, []);

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

  const avgLatency = useMemo(() => {
    if (telemetryWindow.length === 0) return 0;
    return telemetryWindow.reduce((a, b) => a + b.latency, 0) / telemetryWindow.length;
  }, [telemetryWindow]);

  useEffect(() => {
    if (activeLocation) {
      updateShowroomScore(activeLocation, trustScore);
    }
  }, [trustScore, activeLocation, updateShowroomScore]);

  useEffect(() => {
    setIsConnected(true);

    if (!isDemo) {
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

    const interval = setInterval(() => {
      const engine = anomalyEngine.current;

      if (engine.active) {
        engine.tick -= 1;
        if (engine.tick <= 0) {
          engine.active = false;
          latencyRef.current = 950;
        }
      } else if (Math.random() < 0.04) {
        engine.active = true;
        engine.tick = 30;
        const types = ['behavior', 'operational', 'performance'];
        engine.type = types[Math.floor(Math.random() * types.length)];
      }

      const isAttack = engine.active;

      // === Generate 11-Dimensional Industry Telemetry ===
      let latency: number;
      let jitter = Math.max(0.5, gaussianRandom(2, 0.5));
      let ploss = Math.max(0.01, gaussianRandom(0.05, 0.02));
      let cpu = Math.round(gaussianRandom(15, 5));
      let mem = Math.round(gaussianRandom(1200, 100));
      let pfreq = gaussianRandom(50.0, 0.05);
      let vrip = gaussianRandom(12, 2);
      let humid = gaussianRandom(45, 5);
      let temp = gaussianRandom(1.2, 0.4);
      const hours = Math.floor(Date.now() / 3600000 % 1000);

      // Simulation of events
      if (isAttack) {
        if (engine.type === 'behavior') {
          latencyRef.current = Math.min(2600, latencyRef.current + 100);
          cpu = Math.min(95, cpu + 50);
          mem = Math.min(4000, mem + 1200);
        } else if (engine.type === 'performance') {
          latencyRef.current = Math.min(2600, latencyRef.current + 200);
          pfreq = 48.5 + Math.random();
          vrip = 80 + Math.random() * 40;
        } else {
          temp = 25 + Math.random() * 10;
          humid = 85 + Math.random() * 10;
        }
      } else {
        latencyRef.current = latencyRef.current > 1000 ? latencyRef.current - 100 : Math.round(gaussianRandom(950, 20));
      }

      latency = Math.round(latencyRef.current);
      const frequency = Math.max(0, Math.round(500 - (latency * 0.22)));
      const simulatedAdmin = engine.type === 'behavior' ? Math.round(8 + Math.random() * 15) : (latency > 1500 ? 5 : 1);

      // High-Fidelity Derived Scores for UI
      let ops = Math.min(100, Math.max(0, 100 - (Math.abs(50 - pfreq) * 20)));
      let sec = Math.min(100, Math.max(0, 100 - (ploss * 10) - (simulatedAdmin > 10 ? 40 : 0)));
      let perf = Math.min(100, Math.max(0, 100 - (latency / 30)));
      let behav = Math.min(100, Math.max(0, 100 - (cpu / 2)));

      // Centralized API Call to External ML Endpoint
      const telemetryPayload: TelemetryData = {
        latency, jitter, ploss, cpu, mem,
        admin: simulatedAdmin,
        pfreq, vrip, humid, temp, hours
      };

      analyzeTelemetry(telemetryPayload)
      .then((ml: AnalysisResult) => {
        // Result is now the direct ML object from lib/api
        if (!ml) return;

        setTelemetryWindow(prev => [...prev.slice(-19), { timestamp: Date.now(), latency, frequency }]);
        setTrustScores({ operational: ops, security: sec, performance: perf, behavior: behav });

        const mlScore: number = typeof ml.trust_score === 'number' ? ml.trust_score
          : ml.is_anomaly ? 45 : 95;
        
        setTrustScore(mlScore);
        setPredictedTTF(ml.is_anomaly ? (ml.ttf_minutes ?? null) : null);

        if (ml.is_anomaly) {
          useShowroomStore.getState().addHistoryEvent({
            timestamp: new Date().toISOString(),
            location: activeLocation || 'Fleet Gateway',
            event: ml.root_cause ?? 'Anomaly Detected',
            impact: mlScore < 60 ? 'Critical' : 'Moderate',
            status: 'Action Required',
            severity: (ml.severity as any) ?? (mlScore < 60 ? 'High' : 'Medium')
          });

          const payload: StreamPayload = {
            raw_telemetry: {
              display_logs: { content_id: 'disp-01', play_time: 100, frequency },
              admin_actions: { login_time: new Date().toISOString(), content_change: false, device_access: 'anomalous' },
              network_logs: { packets: 12000, latency, bandwidth: 80 },
              behavior_logs: { session_duration: 300, interaction_count: simulatedAdmin },
            },
            engine_analysis: {
              is_anomalous: true,
              anomaly_severity: 7,
              trust_scores: { operational: ops, security: sec, performance: perf, behavior: behav },
              final_trust_score: mlScore,
              status: 'Inference Conflict Detected',
            },
            hybrid_ml_context: {
              ...ml,
              mlResult: ml,
              telemetry_vector: telemetryPayload
            }
          };
          setRecentAnomalies(prev => [payload, ...prev].slice(0, 5));
        } else {
          if (mlScore > 90) setRecentAnomalies([]);
        }
      })
      .catch((err: any) => {
        console.warn("Telemetry analysis failed:", err);
        setTelemetryWindow(prev => [...prev.slice(-19), { timestamp: Date.now(), latency, frequency }]);
        setTrustScore(Math.round(ops * 0.4 + sec * 0.6));
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [isDemo, activeLocation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'D' && e.shiftKey) { setManualOverride(true); anomalyEngine.current = { active: true, tick: 20, type: 'performance' }; }
      if (e.key === 'i' && e.ctrlKey) setShowInspector(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCritical = trustScore < 60;
  const isWarning = trustScore < 80;

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col" style={{ background: '#080c14', color: '#e2e8f0' }}>
      <header className="shrink-0 z-50 px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(8,12,20,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-4">
          {activeLocation && <button onClick={() => setActiveLocation(null)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 text-cyan-400 hover:bg-white/5 transition-all">← Fleet</button>}
          <div>
            <h1 className="text-lg font-black tracking-tight text-cyan-400">TrustOps AI {activeLocation && <span className="text-gray-500 font-normal">/ {activeLocation}</span>}</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#334155] font-bold">Decision Intelligence Layer {isDemo && <span className="text-orange-500 ml-2">· INDUSTRIAL SCALED</span>}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2 border ${isCritical ? 'bg-red-950/20 border-red-500/30 text-red-500' : isWarning ? 'bg-orange-950/20 border-orange-500/30 text-orange-500' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-cyan-400'}`} />
            {isCritical ? 'Critical' : isWarning ? 'Degraded' : 'Active'}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        {!activeLocation ? (
          <FleetView onSelectShowroom={setActiveLocation} isDemo={isDemo} recentAnomalies={recentAnomalies} />
        ) : (
          <div className="h-full grid grid-cols-3 border-t border-white/5">
            <div className="flex flex-col border-r border-white/5 min-h-0">
              <div className="flex-1 min-h-0 overflow-hidden"><TelemetryCharts data={telemetryWindow} /></div>
              <div className="shrink-0 p-4 border-t border-white/5 grid grid-cols-2 gap-4 bg-black/40">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5"><p className="text-[9px] text-gray-500 font-black uppercase tracking-tighter mb-1">Avg Latency</p><p className="text-xl font-black text-cyan-400">{avgLatency.toFixed(1)} ms</p></div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5"><p className="text-[9px] text-gray-500 font-black uppercase tracking-tighter mb-1">System Frequency</p><p className="text-xl font-black text-purple-400">{telemetryWindow[telemetryWindow.length-1]?.frequency.toFixed(1)} Hz</p></div>
              </div>
            </div>
            <div className="flex flex-col border-r border-white/5 p-4 gap-4 overflow-y-auto bg-[#0a0f18]">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Industrial Trust Composite</p><TrustScoreGauge score={trustScore} /></div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"><MultiScoreDisplay scores={trustScores} /></div>
              <PredictiveTimeline currentScore={trustScore} trustScores={trustScores} predictedTTF={predictedTTF} isDemo={isDemo} />
            </div>
            <div className="p-4 overflow-y-auto"><SecurityCopilot trustScore={trustScore} recentAnomalies={recentAnomalies} isDemo={isDemo} /></div>
          </div>
        )}
      </main>

      <ModelInspector 
        isOpen={showInspector} 
        onClose={() => setShowInspector(false)} 
        rawMLData={recentAnomalies[0]?.hybrid_ml_context || {
          trust_score: trustScore,
          context: trustScore < 80 ? 'Sensor Instability' : 'Optimal Baseline',
          origin: 'Fleet Intelligence Core',
          ttf: predictedTTF || 999
        }}
      />
    </div>
  );
}
