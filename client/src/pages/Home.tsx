import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TrustScoreGauge } from '@/components/TrustScoreGauge';
import { TelemetryCharts } from '@/components/TelemetryCharts';
import { SecurityCopilot } from '@/components/SecurityCopilot';
import { MultiScoreDisplay, TrustScores } from '@/components/MultiScoreDisplay';
import { PredictiveTimeline } from '@/components/PredictiveTimeline';
import { BusinessImpactAnalysis } from '@/components/BusinessImpactAnalysis';
import { FleetView } from '@/components/FleetView';
import { useStochasticStream } from '@/hooks/useStochasticStream';

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

  const anomalyEngine = useRef<{ active: boolean; type: string; tick: number }>({ active: false, type: '', tick: 0 });

  // Hook handles organic charting data independently from the backend logic
  const stochasticData = useStochasticStream(anomalyEngine.current.active);

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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">
              TrustOps AI {activeLocation && <span className="text-gray-100 font-medium text-xl ml-2 border-l border-gray-700 pl-2">{activeLocation}</span>}
            </h1>
            <p className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mt-1">
              Intelligence Layer ABOVE Existing Systems {isDemo && <span className="text-yellow-500 font-bold ml-2">(Demo Mode Active)</span>}
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!activeLocation ? (
          <FleetView onSelectShowroom={setActiveLocation} isDemo={isDemo} />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
               <button 
                onClick={() => setActiveLocation(null)} 
                className="text-xs bg-gray-900 border border-gray-800 px-3 py-1.5 rounded uppercase tracking-widest text-cyan-500 hover:bg-gray-800 hover:text-cyan-400 font-bold flex items-center gap-2 transition-colors"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                 Exit to Fleet Architecture
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="sticky top-8">
                  <h2 className="text-lg font-semibold text-cyan-400 mb-4">Telemetry</h2>
                  <TelemetryCharts data={stochasticData} />
                </div>
              </div>

              <div className="md:col-span-1 flex flex-col items-center">
                <div className="w-full">
                  <h2 className="text-lg font-semibold text-cyan-400 mb-6 text-center">Composite Operations Trust</h2>
                  <TrustScoreGauge score={trustScore} />
                  <MultiScoreDisplay scores={trustScores} />
                  <PredictiveTimeline currentScore={trustScore} isDemo={isDemo} />
                  <BusinessImpactAnalysis currentScore={trustScore} trustScores={trustScores} />
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="sticky top-8">
                  <h2 className="text-lg font-semibold text-cyan-400 mb-4">Intelligence</h2>
                  <SecurityCopilot trustScore={trustScore} recentAnomalies={recentAnomalies} isDemo={isDemo} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
