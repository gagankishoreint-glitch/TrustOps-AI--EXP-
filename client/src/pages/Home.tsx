import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

import { TrustScoreGauge } from '@/components/TrustScoreGauge';
import { TelemetryCharts } from '@/components/TelemetryCharts';
import { SecurityCopilot } from '@/components/SecurityCopilot';
import { MultiScoreDisplay, TrustScores } from '@/components/MultiScoreDisplay';
import { PredictiveTimeline } from '@/components/PredictiveTimeline';
import { FleetView } from '@/components/FleetView';
import { useShowroomStore } from '@/store/useShowroomStore';
import { ModelInspector } from '@/components/ModelInspector';
import { analyzeTelemetry, type TelemetryData, type AnalysisResult } from '@/lib/api';
import testScenarios from '@/lib/testScenarios.json';

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

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

  const isDemo = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('demo') !== 'false';
  }, []);

  const [trustScore, setTrustScore] = useState(95);
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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPredictionUpdate, setShowPredictionUpdate] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerType, setBannerType] = useState<'red' | 'amber' | 'blue'>('blue');
  const wasCriticalOrWarning = useRef(false);

  useEffect(() => {
    if (trustScore < 60) {
      setBannerType('red');
      setBannerVisible(true);
      wasCriticalOrWarning.current = true;
    } else if (trustScore < 80) {
      setBannerType('amber');
      setBannerVisible(true);
      wasCriticalOrWarning.current = true;
    } else {
      setBannerType('blue');
      if (wasCriticalOrWarning.current) {
        setBannerVisible(true);
        wasCriticalOrWarning.current = false;
        const timer = setTimeout(() => setBannerVisible(false), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [trustScore]);

  const trustHistoryRef = useRef<number[]>([]);
  const anomalyEngine = useRef<{ active: boolean; type: string; tick: number }>({
    active: false, type: '', tick: 0
  });
  const latencyRef = useRef(950);

  const { updateShowroomScore } = useShowroomStore();

  const avgLatency = useMemo(() => {
    if (telemetryWindow.length === 0) return 0;
    return telemetryWindow.reduce((a, b) => a + b.latency, 0) / telemetryWindow.length;
  }, [telemetryWindow]);

  const isCritical = trustScore < 60;
  const isWarning = trustScore < 80;

  // Sync with global store
  useEffect(() => {
    if (activeLocation) {
      updateShowroomScore(activeLocation, trustScore);
    }
  }, [trustScore, activeLocation, updateShowroomScore]);

  // --- Demo Mode Rotation Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDemoMode) {
      interval = setInterval(() => {
        setCurrentScenarioIndex(prev => (prev + 1) % testScenarios.length);
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [isDemoMode]);

  // --- Main Simulation / Data Cycle ---
  useEffect(() => {
    setIsConnected(true);

    if (!isDemo) {
      // Production Stream Logic (Disabled in static demo environments)
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
        } catch { }
      };
      eventSource.onerror = () => { setIsConnected(false); eventSource.close(); };
      return () => eventSource.close();
    }

    // Static Simulation Logic (Standalone Demo)
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

      // Base Telemetry Generation
      let latency: number;
      let pfreq = gaussianRandom(50.0, 0.05);
      let cpu = Math.round(gaussianRandom(15, 5));
      let mem = Math.round(gaussianRandom(1200, 100));
      let ploss = Math.max(0.01, gaussianRandom(0.05, 0.02));
      let simulatedAdmin: number;
      let telemetryPayload: TelemetryData;
      let finalAnalysis: AnalysisResult | null = null;

      if (isDemoMode) {
        const scenario = testScenarios[currentScenarioIndex];
        latency = scenario.telemetry.latency;
        pfreq = (scenario.telemetry as any).pfreq ?? 50.0;
        cpu = (scenario.telemetry as any).cpu ?? 20;
        mem = (scenario.telemetry as any).mem ?? 1100;
        simulatedAdmin = (scenario.telemetry as any).admin ?? 1;

        telemetryPayload = scenario.telemetry as TelemetryData;
        finalAnalysis = scenario.expected_output as unknown as AnalysisResult;
      } else {
        if (isAttack) {
          if (engine.type === 'behavior') {
            latencyRef.current = Math.min(2600, latencyRef.current + 100);
            cpu = Math.min(95, cpu + 50);
          } else if (engine.type === 'performance') {
            latencyRef.current = Math.min(2600, latencyRef.current + 200);
            pfreq = 48.5 + Math.random();
          } else {
            // Environmental
          }
        } else {
          latencyRef.current = latencyRef.current > 1000 ? latencyRef.current - 100 : Math.round(gaussianRandom(950, 20));
        }

        latency = Math.round(latencyRef.current);
        simulatedAdmin = engine.type === 'behavior' ? Math.round(8 + Math.random() * 15) : (latency > 1500 ? 5 : 1);

        telemetryPayload = {
          latency, jitter: 2.0, ploss, cpu, mem,
          admin: simulatedAdmin,
          pfreq, vrip: 12.0, humid: 45.0, temp: 1.2, hours: 300,
          trend: 0.1
        };
      }

      const frequency = Math.max(0, Math.round(500 - (latency * 0.22)));

      // Secondary UI Scores
      const ops = Math.min(100, Math.max(0, 100 - (Math.abs(50 - pfreq) * 20)));
      const sec = Math.min(100, Math.max(0, 100 - (ploss * 10) - (simulatedAdmin > 10 ? 40 : 0)));
      const perf = Math.min(100, Math.max(0, 100 - (latency / 30)));
      const behav = Math.min(100, Math.max(0, 100 - (cpu / 2)));

      const processResult = (ml: AnalysisResult) => {
        if (!ml) return;
        setTelemetryWindow(prev => [...prev.slice(-19), { timestamp: Date.now(), latency, frequency }]);
        setTrustScores({ operational: ops, security: sec, performance: perf, behavior: behav });

        const mlScore = ml.trust_score ?? 95;
        setTrustScore(mlScore);
        setPredictedTTF(ml.is_anomaly ? (ml.ttf_minutes ?? null) : null);

        if (ml.is_anomaly) {
          const payload: StreamPayload = {
            raw_telemetry: {
              display_logs: { content_id: 'disp-01', play_time: 100, frequency },
              admin_actions: { login_time: new Date().toISOString(), content_change: false, device_access: 'anomalous' },
              network_logs: { packets: 12000, latency, bandwidth: 80 },
              behavior_logs: { session_duration: 300, interaction_count: simulatedAdmin },
            },
            engine_analysis: {
              is_anomalous: true,
              anomaly_severity: mlScore < 60 ? 9 : 5,
              trust_scores: { operational: ops, security: sec, performance: perf, behavior: behav },
              final_trust_score: mlScore,
              status: ml.decision || 'Anomaly Detected',
            },
            hybrid_ml_context: {
              ...ml,
              telemetry_vector: telemetryPayload
            }
          };
          setRecentAnomalies(prev => [payload, ...prev].slice(0, 5));

          useShowroomStore.getState().addHistoryEvent({
            timestamp: new Date().toISOString(),
            location: activeLocation || 'Fleet Gateway',
            event: ml.root_cause ?? 'Anomaly Detected',
            impact: mlScore < 60 ? 'Critical' : 'Moderate',
            status: 'Action Required',
            severity: (ml.severity as any) ?? (mlScore < 60 ? 'High' : 'Medium')
          });
        }
      };

      if (isDemoMode && finalAnalysis) {
        processResult(finalAnalysis);
      } else {
        setIsAnalyzing(true);
        analyzeTelemetry(telemetryPayload)
          .then((res) => {
            processResult(res);
            setIsAnalyzing(false);
            setShowPredictionUpdate(true);
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = setTimeout(() => setShowPredictionUpdate(false), 800); // Quick fade out before next 1000ms tick
          })
          .catch(err => {
            console.warn("ML Offline, falling back to local heuristic.", err);
            setTelemetryWindow(prev => [...prev.slice(-19), { timestamp: Date.now(), latency, frequency }]);
            setTrustScore(Math.round(ops * 0.4 + sec * 0.6));
            setIsAnalyzing(false);
          });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemo, isDemoMode, currentScenarioIndex, activeLocation]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'D' && e.shiftKey) { setManualOverride(true); anomalyEngine.current = { active: true, tick: 20, type: 'performance' }; }
      if (e.key === 'i' && e.ctrlKey) setShowInspector(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen md:h-screen w-full md:overflow-hidden flex flex-col" style={{ background: '#080c14', color: '#e2e8f0' }}>
      <header className="shrink-0 z-50 px-4 md:px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(8,12,20,0.9)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3 md:gap-4">
          {activeLocation && <button onClick={() => setActiveLocation(null)} className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border border-white/10 text-cyan-400 hover:bg-white/5 transition-all">← Fleet</button>}
          <div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-cyan-400">TrustOps AI {activeLocation && <span className="text-gray-500 font-normal">/ {activeLocation}</span>}</h1>
            <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#334155] font-bold">Decision Intelligence Layer {isDemo && <span className="text-orange-500 ml-2 hidden sm:inline">· INDUSTRIAL SCALED</span>}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isDemoMode && (
            <select
              className="hidden sm:block bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-400 outline-none hover:bg-white/5 transition-colors"
              value={currentScenarioIndex}
              onChange={(e) => setCurrentScenarioIndex(Number(e.target.value))}
            >
              <option value={0}>Normal Baseline</option>
              <option value={1}>Network Degradation</option>
              <option value={2}>Device Failure</option>
              <option value={3}>Behavior Spike</option>
              <option value={6}>Critical Fault</option>
            </select>
          )}

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 h-full">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isDemoMode ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isDemoMode ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>
              {isDemoMode ? 'SIMULATED DEMO MODE' : isConnected ? 'LIVE ML PREDICTION ACTIVE' : 'Syncing...'}
            </span>
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${isDemoMode ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500 hover:text-white'
                }`}
            >
              {isDemoMode ? 'Stop Demo' : 'SITREP Demo'}
            </button>
          </div>
          <button
            onClick={() => setShowInspector(!showInspector)}
            className="hidden md:block px-4 py-2 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-cyan-900 transition-colors"
          >
            Intelligence Explorer
          </button>
        </div>
      </header>

      {/* Incident Banner */}
      <div 
        className={`shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${
          bannerVisible ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`p-2.5 w-full flex items-center justify-center gap-3 font-black tracking-widest text-[11px] md:text-sm uppercase ${
          bannerType === 'red' ? 'bg-red-500 text-black shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
          bannerType === 'amber' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
          'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${bannerType === 'blue' ? 'bg-white' : 'bg-black'}`} />
          <span>
            {bannerType === 'red' ? 'CRITICAL INCIDENT — Immediate Action Required' :
             bannerType === 'amber' ? 'Warning — Degradation Detected' :
             'System Stable'}
          </span>
          <div className={`w-2 h-2 rounded-full animate-pulse ${bannerType === 'blue' ? 'bg-white' : 'bg-black'}`} />
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto md:overflow-visible">
        {!activeLocation ? (
          <FleetView onSelectShowroom={setActiveLocation} isDemo={isDemo} recentAnomalies={recentAnomalies} />
        ) : (
          <div className="flex flex-col md:grid md:grid-cols-3 border-t border-white/5 h-full">
            <div className="flex flex-col border-b md:border-b-0 md:border-r border-white/5 min-h-0 order-2 md:order-1">
              <div className="h-[300px] md:flex-1 min-h-0 overflow-hidden"><TelemetryCharts data={telemetryWindow} /></div>
              <div className="shrink-0 p-4 border-t border-white/5 grid grid-cols-2 gap-4 bg-black/40">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] md:text-[9px] text-gray-500 font-black uppercase tracking-tighter mb-1">Avg Latency</p>
                  <p className="text-lg md:text-xl font-black text-cyan-400">{avgLatency.toFixed(1)} ms</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[8px] md:text-[9px] text-gray-500 font-black uppercase tracking-tighter mb-1">System Freq</p>
                  <p className="text-lg md:text-xl font-black text-purple-400">{telemetryWindow[telemetryWindow.length - 1]?.frequency.toFixed(1)} Hz</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col border-b md:border-b-0 md:border-r border-white/5 p-4 gap-4 bg-[#0a0f18] order-1 md:order-2">
              <div className={`bg-white/[0.02] border rounded-2xl p-4 md:p-6 flex flex-col items-center order-1 transition-all duration-500 ${
                trustScore < 60 ? 'shadow-[0_0_40px_rgba(239,68,68,0.2)] border-red-500/40 animate-pulse' : 
                trustScore < 80 ? 'shadow-[0_0_40px_rgba(245,158,11,0.2)] border-amber-500/40 animate-pulse' : 
                'border-white/5'
              }`}>
                <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Industrial Trust Composite</p>
                <div className="scale-90 md:scale-100"><TrustScoreGauge score={trustScore} /></div>
                
                {recentAnomalies[0]?.hybrid_ml_context?.root_cause && trustScore < 80 && (() => {
                  const rawSeverity = (recentAnomalies[0]?.hybrid_ml_context?.severity || (trustScore < 60 ? 'critical' : 'high')).toString().toLowerCase();
                  const impactText = rawSeverity === 'critical' ? 'Store operations at risk' :
                                     rawSeverity === 'high' ? 'Service degradation likely' :
                                     rawSeverity === 'medium' ? 'Monitor performance' :
                                     'No operational risk';

                  
                  return (
                    <div className="mt-5 w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex flex-col items-center">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Likely Cause</p>
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                          {recentAnomalies[0].hybrid_ml_context.root_cause}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Business Impact</p>
                        <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-center border ${
                          rawSeverity === 'critical' ? 'border-red-500/50 text-red-400 bg-red-500/5' : 
                          rawSeverity === 'high' ? 'border-amber-500/50 text-amber-400 bg-amber-500/5' : 
                          'border-blue-500/50 text-blue-400 bg-blue-500/5'
                        }`}>
                          {impactText}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 order-2">
                <MultiScoreDisplay scores={trustScores} />
              </div>
              <div className="order-3">
                <PredictiveTimeline currentScore={trustScore} trustScores={trustScores} predictedTTF={predictedTTF} isDemo={isDemo} />
              </div>
            </div>

            <div className="p-4 flex flex-col gap-4 order-3 md:order-3 md:overflow-y-auto">
              {(() => {
                const confidence = recentAnomalies[0]?.hybrid_ml_context?.confidence ?? (trustScore < 80 ? Math.round(100 - (trustScore * 0.4)) : 98);
                const hasAnomaly = !!recentAnomalies[0]?.hybrid_ml_context?.decision;
                return (
                  <div className={`bg-white/[0.02] border rounded-2xl p-4 transition-all duration-500 ${
                    hasAnomaly ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/10' : 'border-white/5 shadow-lg shadow-black/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${hasAnomaly ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex-1">AI Decision Node</p>
                      
                      {isAnalyzing ? (
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Analyzing</span>
                        </div>
                      ) : showPredictionUpdate && (
                        <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400 animate-in fade-in zoom-in duration-300">
                          ML Prediction Updated
                        </span>
                      )}
                    </div>
                    <div className={`text-sm md:text-base font-black uppercase tracking-wide mb-4 ${hasAnomaly ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {recentAnomalies[0]?.hybrid_ml_context?.decision || "System operating normally"}
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
                        <span>Inference Confidence</span>
                        <span className={hasAnomaly ? 'text-amber-400' : 'text-cyan-400'}>{confidence}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${hasAnomaly ? 'bg-amber-400' : 'bg-cyan-400'}`} 
                          style={{ width: `${confidence}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              <SecurityCopilot trustScore={trustScore} recentAnomalies={recentAnomalies} isDemo={isDemo} />
            </div>
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
