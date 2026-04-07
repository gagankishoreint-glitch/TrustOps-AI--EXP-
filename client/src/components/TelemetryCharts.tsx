import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TelemetryData {
  timestamp: number;
  latency: number;
  frequency: number;
}

interface TelemetryChartsProps {
  data: TelemetryData[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ data }) => {
  // Format data for display
  const chartData = data.map((d, idx) => ({
    ...d,
    time: `${idx}s`
  }));

  return (
    <div className="space-y-6">
      {/* Network Latency Chart */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-cyan-400 text-sm font-semibold mb-4">Network Latency (ms)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
              labelStyle={{ color: '#06b6d4' }}
            />
            <Line 
              type="monotone" 
              dataKey="latency" 
              stroke="#06b6d4" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Device Frequency Chart */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-cyan-400 text-sm font-semibold mb-4">Device Frequency</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }}
              labelStyle={{ color: '#06b6d4' }}
            />
            <Line 
              type="monotone" 
              dataKey="frequency" 
              stroke="#a855f7" 
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Avg Latency</span>
          <span className="text-cyan-400 font-mono">
            {data.length > 0 ? (data.reduce((sum, d) => sum + d.latency, 0) / data.length).toFixed(2) : 0} ms
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Peak Frequency</span>
          <span className="text-cyan-400 font-mono">
            {data.length > 0 ? Math.max(...data.map(d => d.frequency)) : 0}
          </span>
        </div>
      </div>
    </div>
  );
};
