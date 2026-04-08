import React from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Wifi, Cpu } from 'lucide-react';

interface TelemetryPoint { timestamp: number; latency: number; frequency: number; }

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0f1a] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-cyan-400 font-mono font-bold">{payload[0]?.value?.toFixed(0)} {unit}</p>
    </div>
  );
};

export const TelemetryCharts: React.FC<{ data: TelemetryPoint[] }> = ({ data }) => {
  const chartData = data.map((d, i) => ({ ...d, t: `${i}s` }));
  const avgLatency = data.length ? data.reduce((s, d) => s + d.latency, 0) / data.length : 0;
  const latencyHigh = avgLatency > 1200;

  const axisStyle = { fill: '#475569', fontSize: 10, fontFamily: 'monospace' };
  const gridStyle = { stroke: '#1e293b', strokeDasharray: '4 4' };

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      {/* ── Latency Chart ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <Wifi className={`w-3.5 h-3.5 ${latencyHigh ? 'text-red-400' : 'text-cyan-400'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Network Latency (ms)</span>
          {latencyHigh && (
            <span className="ml-auto text-[9px] font-bold uppercase text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full animate-pulse">
              ⚠ High
            </span>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={latencyHigh ? '#ef4444' : '#00d4ff'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={latencyHigh ? '#ef4444' : '#00d4ff'} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="t" tick={axisStyle} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={40} domain={[600, 'auto']} />
              <ReferenceLine y={800} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1}
                label={{ value: 'Warning', fill: '#f59e0b', fontSize: 8, position: 'insideRight' }} />
              <ReferenceLine y={1200} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1}
                label={{ value: 'Critical', fill: '#ef4444', fontSize: 8, position: 'insideRight' }} />
              <Tooltip content={<CustomTooltip unit="ms" />} />
              <Area type="monotone" dataKey="latency"
                stroke={latencyHigh ? '#ef4444' : '#00d4ff'}
                strokeWidth={2} fill="url(#latGrad)" dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Frequency Chart ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-2 shrink-0">
          <Cpu className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Device Frequency (Hz)</span>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="freqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="t" tick={axisStyle} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={40} domain={[0, 600]} />
              <ReferenceLine y={300} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1}
                label={{ value: '300Hz', fill: '#f59e0b', fontSize: 9, position: 'right' }} />
              <Tooltip content={<CustomTooltip unit="Hz" />} />
              <Area type="monotone" dataKey="frequency"
                stroke="#a78bfa" strokeWidth={2} fill="url(#freqGrad)" dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
