import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useShowroomStore } from '../store/useShowroomStore';
import { Activity, Server, ShieldAlert, Zap, MapPin, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { SecurityEventLog } from './SecurityEventLog';


interface FleetViewProps {
  onSelectShowroom: (id: string) => void;
  isDemo?: boolean;
  recentAnomalies?: any[];
}

function MiniRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 90 ? '#00d4ff' : score >= 75 ? '#f59e0b' : score >= 60 ? '#f97316' : '#ef4444';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: circ - filled, stroke: color }}
        transition={{ type: 'spring', stiffness: 50, damping: 14 }}
        style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
    </svg>
  );
}

export const FleetView: React.FC<FleetViewProps> = React.memo(({ onSelectShowroom, recentAnomalies }) => {
  const { showrooms, jitterFleet } = useShowroomStore();
  const arr = Object.values(showrooms);

  // Fleet Heartbeat Engine — simulate living telemetry across the network
  React.useEffect(() => {
    const timer = setInterval(() => {
      jitterFleet();
    }, 5000); // Pulse every 5 seconds
    return () => clearInterval(timer);
  }, [jitterFleet]);

  const summary = useMemo(() => ({
    totalNodes: arr.reduce((s, r) => s + r.activeNodes, 0),
    avgScore: Math.round(arr.reduce((s, r) => s + r.score, 0) / arr.length),
    critical: arr.filter(r => r.status === 'Critical').length,
    caution: arr.filter(r => r.status === 'Caution').length,
  }), [arr]);

  const statusCfg = {
    Healthy:  { color: 'text-cyan-400',   border: 'border-cyan-500/30',   bg: 'bg-cyan-500/10',   dot: '#00d4ff', Icon: CheckCircle2 },
    Stable:   { color: 'text-blue-400',   border: 'border-blue-500/30',   bg: 'bg-blue-500/10',   dot: '#60a5fa', Icon: CheckCircle2 },
    Caution:  { color: 'text-amber-400',  border: 'border-amber-500/30',  bg: 'bg-amber-500/10',  dot: '#f59e0b', Icon: AlertTriangle },
    Critical: { color: 'text-red-400',    border: 'border-red-500/30',    bg: 'bg-red-500/10',    dot: '#ef4444', Icon: XCircle },
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6">

      {/* ── Top: Summary Bar ── */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Total Nodes', value: summary.totalNodes, icon: Server, color: 'text-cyan-400' },
          { label: 'Avg Trust Score', value: `${summary.avgScore}%`, icon: Activity, color: 'text-blue-400' },
          { label: 'Caution Nodes', value: summary.caution, icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Critical Nodes', value: summary.critical, icon: ShieldAlert, color: 'text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex items-center gap-4">
            <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{label}</p>
              <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Showroom Cards ── */}
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 h-full">
          {arr.map((room) => {
            const cfg = statusCfg[room.status];
            return (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.01, borderColor: 'rgba(0,212,255,0.3)' }}
                onClick={() => onSelectShowroom(room.id)}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 cursor-pointer flex flex-col justify-between group transition-colors duration-200"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{room.region}</p>
                    </div>
                    <h3 className="text-gray-100 font-bold text-base leading-tight group-hover:text-cyan-400 transition-colors">{room.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{room.city}</p>
                  </div>
                  <motion.div
                    className="w-2.5 h-2.5 rounded-full mt-1"
                    style={{ backgroundColor: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}88` }}
                    animate={{ opacity: room.status === 'Critical' || room.status === 'Caution' ? [1, 0.3, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                </div>

                {/* Score Ring + Score */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative flex-shrink-0">
                    <MiniRing score={room.score} size={64} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-sm font-black tabular-nums ${cfg.color}`}>{Math.round(room.score)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Trust Score</p>
                    <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
                      <cfg.Icon className="w-2.5 h-2.5" />
                      {room.status}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2 border-t border-white/[0.06] pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1"><Server className="w-3 h-3" /> Active Nodes</span>
                    <span className="text-gray-300 font-mono font-bold">{room.activeNodes}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1"><Zap className="w-3 h-3" /> Risk Level</span>
                    <span className={`font-bold ${cfg.color}`}>{room.risk}</span>
                  </div>
                </div>

                {/* CTA */}
                <button className="mt-4 w-full py-2 rounded-lg border border-white/[0.07] bg-white/[0.03] text-gray-500 text-[10px] font-bold uppercase tracking-widest group-hover:border-cyan-500/40 group-hover:text-cyan-400 group-hover:bg-cyan-500/5 transition-all duration-200">
                  Open Intelligence View →
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom: Security Audit Log ── */}
      <div className="shrink-0 h-[300px]">
        <SecurityEventLog recentAnomalies={recentAnomalies || []} />
      </div>
    </div>
  );
});
