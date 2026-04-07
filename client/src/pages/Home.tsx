import React, { useEffect, useState, useCallback } from 'react';
import { TrustScoreGauge } from '@/components/TrustScoreGauge';
import { TelemetryCharts } from '@/components/TelemetryCharts';
import { SecurityCopilot } from '@/components/SecurityCopilot';
import { MultiScoreDisplay, TrustScores } from '@/components/MultiScoreDisplay';
import { PredictiveTimeline } from '@/components/PredictiveTimeline';

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
    correlation_engine?: {
      confidence_score: number;
      correlated_signals: string[];
      root_cause_chain: string;
    };
    status: string;
  };
}

export default function Home() {
  const [trustScore, setTrustScore] = useState(100);
  const [trustScores, setTrustScores] = useState<TrustScores>({
    operational: 100, security: 100, behavior: 100, performance: 100
  });
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [recentAnomalies, setRecentAnomalies] = useState<StreamPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Demo Mode State
  const [isDemo] = useState(() => new URLSearchParams(window.location.search).get('demo') === 'true');
  const [isUnderAttack, setIsUnderAttack] = useState(false);

  // Payload handler
  const handlePayload = useCallback((payload: StreamPayload) => {
    setTrustScore(payload.engine_analysis.final_trust_score);
    setTrustScores(payload.engine_analysis.trust_scores);

    setTelemetryData(prev => {
      const newData = [
        ...prev,
        {
          timestamp: Date.now(),
          latency: payload.raw_telemetry.network_logs.latency,
          frequency: payload.raw_telemetry.display_logs.frequency
        }
      ];
      return newData.slice(-60);
    });

    if (payload.engine_analysis.is_anomalous) {
      setRecentAnomalies(prev => [payload, ...prev].slice(0, 10));
    }
  }, []);

  // Demo Mode: Keyboard trigger
  useEffect(() => {
    if (!isDemo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + D triggers the simulated operational breakdown
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsUnderAttack(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemo, isUnderAttack]);

  // Main Data Stream Connection
  useEffect(() => {
    if (isDemo) {
      setIsConnected(true);
      
      const interval = setInterval(() => {
        // Multi-dimensional decay simulation
        const ops = isUnderAttack ? Math.round(35 + Math.random() * 15) : Math.round(98 + Math.random() * 2);
        const sec = isUnderAttack ? Math.round(85 + Math.random() * 10) : Math.round(97 + Math.random() * 3);
        const perf = isUnderAttack ? Math.round(40 + Math.random() * 20) : Math.round(96 + Math.random() * 4);
        const behav = isUnderAttack ? Math.round(65 + Math.random() * 15) : Math.round(99 + Math.random() * 1);
        
        // Weighted Average calculation (Ops 30%, Sec 30%, Perf 20%, Behav 20%)
        const finalWeighted = Math.round((ops * 0.3) + (sec * 0.3) + (perf * 0.2) + (behav * 0.2));

        const payload: StreamPayload = {
          raw_telemetry: {
            display_logs: { 
              content_id: 'display-01', 
              play_time: 120, 
              frequency: isUnderAttack ? Math.round(Math.random() * 50) : Math.round(500 + Math.random() * 50)
            },
            admin_actions: { login_time: new Date().toISOString(), content_change: false, device_access: 'normal' },
            network_logs: { 
              packets: isUnderAttack ? 15000 : 800, 
              latency: isUnderAttack ? Math.round(800 + Math.random() * 400) : Math.round(20 + Math.random() * 15), 
              bandwidth: 100 
            },
            behavior_logs: { session_duration: 300, interaction_count: 5 },
          },
          engine_analysis: {
            is_anomalous: isUnderAttack,
            anomaly_severity: isUnderAttack ? 7 : 0,
            trust_scores: {
              operational: ops,
              security: sec,
              performance: perf,
              behavior: behav
            },
            final_trust_score: finalWeighted,
            correlation_engine: isUnderAttack ? {
              confidence_score: 97,
              correlated_signals: ['Latency Spike', 'Device Frequency Drop', 'Failed Admin Override'],
              root_cause_chain: 'Network Latency Volatility → Display Desync → Admin Override Attempt'
            } : undefined,
            status: isUnderAttack ? 'Operational Friction Detected' : 'Healthy',
          }
        };

        handlePayload(payload);
      }, 1000); 

      return () => clearInterval(interval);
    } else {
      // Real SSE Connection
      const eventSource = new EventSource('http://127.0.0.1:8000/api/v1/stream');

      eventSource.onopen = () => { setIsConnected(true); };
      eventSource.onmessage = (event) => {
        try {
          const payload: StreamPayload = JSON.parse(event.data);
          handlePayload(payload);
        } catch (error) { console.error(error); }
      };
      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
      };
      return () => { eventSource.close(); };
    }
  }, [isDemo, isUnderAttack, handlePayload]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">TrustOps AI</h1>
            <p className="text-gray-400 text-sm">
              Operational Intelligence Dashboard {isDemo && <span className="text-yellow-500 ml-2">(Demo Mode Active)</span>}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded border ${isConnected ? (isUnderAttack ? 'border-red-500 bg-red-950/20' : 'border-green-500 bg-green-950/20') : 'border-red-500 bg-red-950/20'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? (isUnderAttack ? 'bg-red-500' : 'bg-green-500') : 'bg-red-500'} animate-pulse`}></div>
            <span className={`text-xs font-semibold ${isConnected ? (isUnderAttack ? 'text-red-400' : 'text-green-400') : 'text-red-400'}`}>
              {isConnected ? (isUnderAttack ? 'Critical' : 'Live') : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Telemetry */}
          <div className="md:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4">Telemetry</h2>
              <TelemetryCharts data={telemetryData} />
            </div>
          </div>

          {/* Center Column: Scored Components */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="w-full">
              <h2 className="text-lg font-semibold text-cyan-400 mb-6 text-center">Composite Operations Trust</h2>
              <TrustScoreGauge score={trustScore} />
              
              {/* New Multi-Score Component Below */}
              <MultiScoreDisplay scores={trustScores} />

              {/* Predictive Timeline Component Below */}
              <PredictiveTimeline currentScore={trustScore} isDemo={isDemo} />
            </div>
          </div>

          {/* Right Column: Security Copilot */}
          <div className="md:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4">Intelligence</h2>
              <SecurityCopilot trustScore={trustScore} recentAnomalies={recentAnomalies} isDemo={isDemo} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
