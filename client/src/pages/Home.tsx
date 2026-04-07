import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { TrustScoreGauge } from '@/components/TrustScoreGauge';
import { TelemetryCharts } from '@/components/TelemetryCharts';
import { SecurityCopilot } from '@/components/SecurityCopilot';
import { MultiScoreDisplay, TrustScores } from '@/components/MultiScoreDisplay';
import { PredictiveTimeline } from '@/components/PredictiveTimeline';
import { BusinessImpactAnalysis } from '@/components/BusinessImpactAnalysis';
import { FleetView } from '@/components/FleetView';
import { useShowroomStore } from '@/store/useShowroomStore';

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
  const [isDemo] = useState(() => new URLSearchParams(window.location.search).get('demo') === 'true');

  // === SINGLE REACTIVE STATE — everything derives from this ===
  const [trustScore, setTrustScore] = useState(100);
  const [trustScores, setTrustScores] = useState<TrustScores>({
    operational: 100, security: 100, behavior: 100, performance: 100
  });
  const [telemetryWindow, setTelemetryWindow] = useState<TelemetryPoint[]>([]);
  const [recentAnomalies, setRecentAnomalies] = useState<StreamPayload[]>([]);

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

    // Performance score reacts directly to latency
    let performance = trustScores.performance;
    if (latency > 2000) performance = Math.round(20 + Math.random() * 10);
    else if (latency > 1200) performance = Math.round(45 + Math.random() * 15);
    else if (latency > 800) performance = Math.round(70 + Math.random() * 10);
    else performance = Math.min(100, Math.round(90 + Math.random() * 10));

    // Operational score reacts to frequency
    let operational = trustScores.operational;
    if (frequency < 200) operational = Math.round(30 + Math.random() * 15);
    else if (frequency < 300) operational = Math.round(55 + Math.random() * 15);
    else if (frequency < 400) operational = Math.round(75 + Math.random() * 10);
    else operational = Math.min(100, Math.round(92 + Math.random() * 8));

    return {
      operational,
      performance,
      security: trustScores.security,
      behavior: trustScores.behavior,
    };
  }, [telemetryWindow, trustScores]);

  const reactiveTrustScore = useMemo(() => {
    const { operational, security, performance, behavior } = reactiveTrustScores;
    return Math.round(operational * 0.3 + security * 0.3 + performance * 0.2 + behavior * 0.2);
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
            // Random walk latency upward
            latencyRef.current = Math.min(2600, latencyRef.current + (60 + Math.random() * 80));
            perf = Math.round(20 + Math.random() * 15);
            ops = Math.round(45 + Math.random() * 15);
          } else {
            latencyRef.current = Math.round(gaussianRandom(950, 15));
          }
        } else if (type === 'performance') {
          latencyRef.current = Math.min(2600, latencyRef.current + (80 + Math.random() * 100));
          perf = Math.round(25 + Math.random() * 20);
        } else {
          ops = Math.round(40 + Math.random() * 20);
          latencyRef.current = Math.round(gaussianRandom(950, 15));
        }

        frequency = Math.max(50, Math.round(500 - (latencyRef.current * 0.18)));
      } else {
        // Organic jitter during recovery
        latencyRef.current = Math.max(800, latencyRef.current - (isAttack ? 0 : 30 + Math.random() * 20));
        latencyRef.current = Math.round(gaussianRandom(950, 15));
        frequency = Math.round(gaussianRandom(500, 5));
      }

      latency = Math.round(latencyRef.current);
      frequency = Math.max(0, Math.round(frequency!));

      // Clamp scores 0-100
      ops = Math.min(100, Math.max(0, ops));
      sec = Math.min(100, Math.max(0, sec));
      perf = Math.min(100, Math.max(0, perf));
      behav = Math.min(100, Math.max(0, behav));

      const finalWeighted = Math.round(ops * 0.3 + sec * 0.3 + perf * 0.2 + behav * 0.2);

      // Update ALL state from this single tick
      setTelemetryWindow(prev => [...prev.slice(-19), { timestamp: Date.now(), latency, frequency }]);
      setTrustScores({ operational: ops, security: sec, performance: perf, behavior: behav });
      setTrustScore(finalWeighted);

      if (isAttack) {
        const payload: StreamPayload = {
          raw_telemetry: {
            display_logs: { content_id: 'display-01', play_time: 120, frequency },
            admin_actions: { login_time: new Date().toISOString(), content_change: false, device_access: 'anomalous' },
            network_logs: { packets: 15000, latency, bandwidth: 100 },
            behavior_logs: { session_duration: 300, interaction_count: 5 },
          },
          engine_analysis: {
            is_anomalous: true,
            anomaly_severity: 8,
            trust_scores: { operational: ops, security: sec, performance: perf, behavior: behav },
            final_trust_score: finalWeighted,
            status: 'Autonomous Anomaly Detected',
          }
        };
        setRecentAnomalies(prev => [payload, ...prev].slice(0, 10));
      } else {
        // Clear anomalies when recovered
        if (finalWeighted > 85) setRecentAnomalies([]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemo]);

  // Shift+D Executive override
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'D' && e.shiftKey) {
        setManualOverride(true);
        anomalyEngine.current = { active: true, tick: 30, type: 'behavior' };
        latencyRef.current = 950;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCritical = reactiveTrustScore < 60;
  const isWarning = reactiveTrustScore < 80;

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-950 text-gray-100 flex flex-col">
      {/* Header — shrink-0 so it never compresses */}
      <header className="shrink-0 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm z-50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeLocation && (
              <button
                onClick={() => {
                setActiveLocation(null);
                setManualOverride(false); // Clear override badge when exiting showroom
              }}
                className="text-[10px] bg-gray-800 border border-gray-700 px-3 py-1.5 rounded uppercase tracking-widest text-cyan-500 hover:bg-gray-700 font-bold flex items-center gap-2 transition-colors"
              >
                ← Fleet
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-cyan-400 leading-none">
                TrustOps AI
                {activeLocation && <span className="text-gray-300 font-normal text-base ml-2">/ {activeLocation}</span>}
              </h1>
              <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mt-0.5">
                Intelligence Layer ABOVE Existing Systems
                {isDemo && <span className="text-yellow-500 ml-2">· Demo</span>}
                {manualOverride && activeLocation && <span className="text-red-500 animate-pulse ml-2">· Manual Override</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live latency badge */}
            {activeLocation && avgLatency > 0 && (
              <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                avgLatency > 1200 ? 'text-red-400 border-red-500/50 bg-red-950/30 animate-pulse' : 'text-gray-400 border-gray-700'
              }`}>
                Avg Latency: {Math.round(avgLatency)}ms
              </div>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold ${
              isCritical ? 'border-red-500 bg-red-950/20 text-red-400' :
              isWarning ? 'border-yellow-500 bg-yellow-950/20 text-yellow-400' :
              'border-green-500 bg-green-950/20 text-green-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'}`} />
              {isCritical ? 'Critical' : isWarning ? 'Degraded' : 'Live'}
            </div>
          </div>
        </div>
      </header>

      {/* Main content — flex-1 takes all remaining height */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {!activeLocation ? (
          // Fleet View — scrollable inside the constrained height
          <div className="h-full overflow-y-auto p-6">
            <FleetView onSelectShowroom={setActiveLocation} isDemo={isDemo} />
          </div>
        ) : (
          // 3-Column Detail View — strictly h-full, no overflow
          <div className="h-full grid grid-cols-3 gap-0 divide-x divide-gray-800/60">

            {/* ── Column 1: TELEMETRY ── */}
            <div className="flex flex-col min-h-0 p-4 gap-3">
              <div className="shrink-0">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Live Telemetry</p>
              </div>
              {/* Charts take all remaining space */}
              <div className="flex-1 min-h-0 bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
                <TelemetryCharts data={telemetryWindow} />
              </div>
            </div>

            {/* ── Column 2: TRUST MATRIX ── */}
            <div className="flex flex-col min-h-0 p-4 gap-3">
              {/* Gauge */}
              <div className="shrink-0 bg-gray-900/50 rounded-lg border border-gray-800 p-4 flex flex-col items-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Composite Operations Trust</p>
                <TrustScoreGauge score={reactiveTrustScore} />
              </div>

              {/* Sub-score bars */}
              <div className="flex-1 min-h-0 bg-gray-900/50 rounded-lg border border-gray-800 p-4 overflow-y-auto">
                <MultiScoreDisplay scores={reactiveTrustScores} />
              </div>

              {/* Projected Risk — always visible */}
              <div className="shrink-0 bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
                <PredictiveTimeline currentScore={reactiveTrustScore} isDemo={isDemo} />
              </div>
            </div>

            {/* ── Column 3: INTELLIGENCE ── */}
            <div className="flex flex-col min-h-0 p-4 gap-3 overflow-y-auto">
              {/* XAI Engine */}
              <div className="shrink-0">
                <SecurityCopilot
                  trustScore={reactiveTrustScore}
                  recentAnomalies={recentAnomalies}
                  isDemo={isDemo}
                />
              </div>

              {/* Business Impact — anchored at bottom, only visible when failing */}
              <div className="shrink-0">
                <BusinessImpactAnalysis
                  currentScore={reactiveTrustScore}
                  trustScores={reactiveTrustScores}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
