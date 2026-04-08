import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, MapPin, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useShowroomStore, HistoryEvent } from '../store/useShowroomStore';

const severityColors = {
  Low: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  High: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const statusIcons = {
  'Resolved': <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  'Monitoring': <Info className="w-3 h-3 text-blue-400" />,
  'Action Required': <AlertTriangle className="w-3 h-3 text-amber-400" />,
};

interface SecurityEventLogProps {
  recentAnomalies?: any[];
}

export const SecurityEventLog: React.FC<SecurityEventLogProps> = ({ recentAnomalies = [] }) => {
  const { fleetHistory } = useShowroomStore();

  const events = useMemo(() => {
    // Map live session anomalies to the log format
    const liveEvents = recentAnomalies.map((anom, i) => {
      const ml = anom.hybrid_ml_context || anom.engine_analysis || {};
      const tel = anom.raw_telemetry || {};
      
      return {
        id: `live-${i}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        location: anom.location || 'Unknown Node',
        event: ml.context || 'Anomaly Detected',
        impact: ml.trust_score < 60 ? 'Critical Disruption' : 'Audit Baseline Sync Active',
        status: ml.trust_score < 60 ? 'Action Required' : 'Monitoring',
        severity: ml.trust_score < 60 ? 'High' : (ml.trust_score < 80 ? 'Medium' : 'Low'),
      };
    });

    // Merge global store history with current session events
    return [...liveEvents, ...fleetHistory].slice(0, 10);
  }, [recentAnomalies, fleetHistory]);

  return (
    <div className="flex flex-col h-full bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h3 className="text-gray-100 text-xs font-bold uppercase tracking-widest">Fleet Intelligence Archive</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-gray-500 uppercase font-black">Audit Sync Live</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.04] bg-white/[0.01]">
              <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Timestamp</th>
              <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Location</th>
              <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Security Event</th>
              <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500">Business Impact</th>
              <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-gray-500 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[11px] text-gray-600 italic">
                  Awaiting real-time intelligence events...
                </td>
              </tr>
            ) : (
              events.map((event, idx) => (
                <motion.tr 
                  key={event.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-5 py-3 tabular-nums text-[11px] text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-600" />
                      {event.timestamp}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-bold text-gray-300 uppercase tracking-tight">
                        {event.location}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-200 font-medium">{event.event}</span>
                      <span className={`inline-flex w-fit mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${severityColors[event.severity as keyof typeof severityColors]}`}>
                        {event.severity} Severity
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 italic">
                    {event.impact}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        event.status === 'Resolved' ? 'text-emerald-400' : 
                        event.status === 'Monitoring' ? 'text-blue-400' : 'text-amber-400'
                      }`}>
                        {event.status}
                      </span>
                      {statusIcons[event.status as keyof typeof statusIcons]}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
