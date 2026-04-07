import React, { useEffect, useState } from 'react';
import { TrustScoreGauge } from '@/components/TrustScoreGauge';
import { TelemetryCharts } from '@/components/TelemetryCharts';
import { SecurityCopilot } from '@/components/SecurityCopilot';

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
    trust_score: number;
    status: string;
  };
}

export default function Home() {
  const [trustScore, setTrustScore] = useState(100);
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [recentAnomalies, setRecentAnomalies] = useState<StreamPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource('http://127.0.0.1:8000/api/v1/stream');

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('Connected to telemetry stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const payload: StreamPayload = JSON.parse(event.data);
        
        // Update trust score
        setTrustScore(payload.engine_analysis.trust_score);

        // Update telemetry data (keep last 60 points)
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

        // Track anomalies
        if (payload.engine_analysis.is_anomalous) {
          setRecentAnomalies(prev => [payload, ...prev].slice(0, 10));
        }
      } catch (error) {
        console.error('Failed to parse stream data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.error('Stream connection error');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-cyan-400">TrustOps AI</h1>
            <p className="text-gray-400 text-sm">Operational Intelligence Dashboard</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded border ${isConnected ? 'border-green-500 bg-green-950/20' : 'border-red-500 bg-red-950/20'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className={`text-xs font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Telemetry */}
          <div className="md:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4">Telemetry</h2>
              <TelemetryCharts data={telemetryData} />
            </div>
          </div>

          {/* Center Column: Trust Score Hero */}
          <div className="md:col-span-1 flex items-center justify-center">
            <div className="w-full">
              <h2 className="text-lg font-semibold text-cyan-400 mb-8 text-center">Operational Health</h2>
              <TrustScoreGauge score={trustScore} />
            </div>
          </div>

          {/* Right Column: Security Copilot */}
          <div className="md:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4">Intelligence</h2>
              <SecurityCopilot trustScore={trustScore} recentAnomalies={recentAnomalies} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
