import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TrustScoreGauge } from '@/components/TrustScoreGauge';
import { TelemetryCharts } from '@/components/TelemetryCharts';
import { SecurityCopilot } from '@/components/SecurityCopilot';
import { MultiScoreDisplay, TrustScores } from '@/components/MultiScoreDisplay';
import { PredictiveTimeline } from '@/components/PredictiveTimeline';
import { BusinessImpactAnalysis } from '@/components/BusinessImpactAnalysis';
import { FleetView } from '@/components/FleetView';
import { useStochasticStream } from '@/hooks/useStochasticStream';
import { useShowroomStore } from '@/store/useShowroomStore';
import { useInference } from '@/hooks/useInference';

interface TelemetryData {
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

export default function Home() {
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState(100);
  const [trustScores, setTrustScores] = useState<TrustScores>({
    operational: 100, security: 100, behavior: 100, performance: 100
  });
  const [recentAnomalies, setRecentAnomalies] = useState<StreamPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemo] = useState(() => new URLSearchParams(window.location.search).get('demo') === 'true');
  const [manualOverride, setManualOverride] = useState(false);

  const anomalyEngine = useRef<{ active: boolean; type: string; tick: number }>({ active: false, type: '', tick: 0 });

  // Real-time Intelligence Interceptor
  const stochasticData = useStochasticStream(anomalyEngine.current.active);
  const { operationalScore } = useInference(stochasticData);
  const { updateShowroomScore } = useShowroomStore();

  // Pipe intelligence to global store for persistence
  useEffect(() => {
    if (activeLocation) {
      updateShowroomScore(activeLocation, operationalScore);
    }
  }, [operationalScore, activeLocation, updateShowroomScore]);

  const handlePayload = useCallback((payload: StreamPayload) => {
    setTrustScore(payload.engine_analysis.final_trust_score);
    setTrustScores(payload.engine_analysis.trust_scores);

    if (payload.engine_analysis.is_anomalous) {
      setRecentAnomalies(prev => [payload, ...prev].slice(0, 10));
    }
  }, []);

  // Main Data Stream Connection
  useEffect(() => {
    if (isDemo) {
      setIsConnected(true);
      
      const interval = setInterval(() => {
        // Autonomous Synthetic Intelligence Generator
        if (anomalyEngine.current.active) {
          anomalyEngine.current.tick -= 1;
          if (anomalyEngine.current.tick <= 0) anomalyEngine.current.active = false;
        } else {
          // 4% chance per second to generate organic anomalies
          if (Math.random() < 0.04) {
             anomalyEngine.current.active = true;
             anomalyEngine.current.tick = 25; // Extend tick to show the cascade
             // Force behavior logic to simulate Human+System narrative
             const anomalyTypes = ['behavior', 'behavior', 'operational'];
             anomalyEngine.current.type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
          }
        }

        const isAttack = anomalyEngine.current.active;
        const type = anomalyEngine.current.type;
        const currentTick = anomalyEngine.current.tick;

        // Base metrics
        let ops = Math.round(98 + Math.random() * 2);
        let sec = Math.round(97 + Math.random() * 3);
        let perf = Math.round(96 + Math.random() * 4);
        let behav = Math.round(99 + Math.random() * 1);
        
        let latency = Math.round(20 + Math.random() * 15);
        let freq = Math.round(500 + Math.random() * 50);

        // Apply Synthetic Anomaly Degradation (Human + System Scripted Cascade)
        if (isAttack) {
          if (type === 'behavior' || type === 'operational') {
            behav = Math.round(35 + Math.random() * 15); // Drop immediately
            
            // At tick 16, cascade the failure into the network performance
            if (currentTick < 16) {
              perf = Math.round(25 + Math.random() * 10);
              latency = Math.round(1800 + Math.random() * 800);
              ops = Math.round(50 + Math.random() * 10);
            }
          }
        }

        const finalWeighted = Math.round((ops * 0.3) + (sec * 0.3) + (perf * 0.2) + (behav * 0.2));

        const payload: StreamPayload = {
          raw_telemetry: {
            display_logs: { content_id: 'display-01', play_time: 120, frequency: freq },
            admin_actions: { login_time: new Date().toISOString(), content_change: false, device_access: 'normal' },
            network_logs: { packets: isAttack ? 15000 : 800, latency: latency, bandwidth: 100 },
            behavior_logs: { session_duration: 300, interaction_count: 5 },
          },
          engine_analysis: {
            is_anomalous: isAttack,
            anomaly_severity: isAttack ? 8 : 0,
            trust_scores: { operational: ops, security: sec, performance: perf, behavior: behav },
            final_trust_score: finalWeighted,
            status: isAttack ? 'Autonomous Anomaly Correlated' : 'Healthy',
          }
        };

        handlePayload(payload);
      }, 1000); 

      return () => clearInterval(interval);
    } else {
      const eventSource = new EventSource('http://127.0.0.1:8000/api/v1/stream');
      eventSource.onopen = () => { setIsConnected(true); };
      eventSource.onmessage = (event) => {
        try {
          const payload: StreamPayload = JSON.parse(event.data);
          handlePayload(payload);
        } catch (error) {}
      };
      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
      };
      return () => { eventSource.close(); };
    }
  }, [isDemo, handlePayload]);

  // Executive Presentation Override (Shift + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'D' && e.shiftKey) {
        setManualOverride(true);
        anomalyEngine.current.active = true;
        anomalyEngine.current.tick = 25; // Force cascade depth
        anomalyEngine.current.type = 'behavior'; // Force specific Human+System narrative
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur shrink-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">
              TrustOps AI {activeLocation && <span className="text-gray-100 font-medium text-xl ml-2 border-l border-gray-700 pl-2">{activeLocation}</span>}
            </h1>
            <p className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mt-1">
              Intelligence Layer ABOVE Existing Systems 
              {isDemo && <span className="text-yellow-500 font-bold ml-2">(Demo Mode Active)</span>}
              {manualOverride && <span className="text-red-500 font-black ml-2 animate-pulse">[MANUAL OVERRIDE: ACTIVE]</span>}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded border ${isConnected ? (anomalyEngine.current.active ? 'border-red-500 bg-red-950/20' : 'border-green-500 bg-green-950/20') : 'border-red-500 bg-red-950/20'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? (anomalyEngine.current.active ? 'bg-red-500' : 'bg-green-500') : 'bg-red-500'} animate-pulse`}></div>
            <span className={`text-xs font-semibold ${isConnected ? (anomalyEngine.current.active ? 'text-red-400' : 'text-green-400') : 'text-red-400'}`}>
              {isConnected ? (anomalyEngine.current.active ? 'Critical' : 'Live') : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* 3-Column Constraint 100VH Content Grid */}
      <main className="flex-1 overflow-hidden p-6">
        {activeLocation ? (
          <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Telemetry */}
            <div className="lg:col-span-1 flex flex-col min-h-0">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4 shrink-0">Telemetry</h2>
              <div className="flex-1 bg-gray-900/40 rounded-lg p-4 border border-gray-800 min-h-0 flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <TelemetryCharts data={stochasticData} />
                </div>
              </div>
            </div>

            {/* Column 2: Trust Matrix */}
            <div className="lg:col-span-1 flex flex-col min-h-0">
              <div className="flex-none bg-gray-900/40 rounded-lg p-6 border border-gray-800 flex flex-col items-center justify-center mb-6">
                <h2 className="text-sm font-bold tracking-widest uppercase text-cyan-400 mb-6 text-center">Composite Operations Trust</h2>
                <TrustScoreGauge score={operationalScore} />
              </div>
              
              <div className="flex-1 bg-gray-900/40 rounded-lg p-6 border border-gray-800 min-h-0 overflow-y-auto">
                <MultiScoreDisplay scores={{...trustScores, operational: operationalScore}} />
              </div>
            </div>

            {/* Column 3: Intelligence & Projection */}
            <div className="lg:col-span-1 flex flex-col min-h-0 gap-6">
              <div className="flex-none">
                <SecurityCopilot 
                  trustScore={operationalScore} 
                  recentAnomalies={recentAnomalies} 
                  isDemo={isDemo} 
                />
              </div>

              <div className="flex-1 bg-gray-900/40 rounded-lg border border-gray-800 min-h-0 flex flex-col">
                <div className="flex-1 p-6 overflow-y-auto">
                  <PredictiveTimeline currentScore={operationalScore} isDemo={isDemo} />
                </div>
                <div className="shrink-0 p-4 border-t border-gray-800 bg-gray-900/60 rounded-b-lg">
                  <BusinessImpactAnalysis 
                    currentScore={operationalScore} 
                    trustScores={{...trustScores, operational: operationalScore}} 
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <FleetView onSelectShowroom={setActiveLocation} isDemo={isDemo} />
          </div>
        )}
      </main>
    </div>
  );
}
