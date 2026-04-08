import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Clock, MapPin, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface SecurityEvent {
  id: string;
  timestamp: string;
  location: string;
  event: string;
  impact: string;
  status: 'Resolved' | 'Monitoring' | 'Action Required';
  severity: 'Low' | 'Medium' | 'High';
}

const mockEvents: SecurityEvent[] = [
  {
    id: '1',
    timestamp: '2026-04-08 12:14:02',
    location: 'Hyderabad Deccan',
    event: 'Anomalous Admin Login Density',
    impact: 'Moderate Operational Risk (₹4.7L)',
    status: 'Action Required',
    severity: 'Medium'
  },
  {
    id: '2',
    timestamp: '2026-04-08 11:30:45',
    location: 'Mumbai HQ',
    event: 'Packet Fragmentation Spike',
    impact: 'Low - Automated Throttling Active',
    status: 'Monitoring',
    severity: 'Low'
  },
  {
    id: '3',
    timestamp: '2026-04-08 10:15:20',
    location: 'Delhi NCR',
    event: 'Unauthorized API Token Refresh',
    impact: 'Critical - System Rotation Triggered',
    status: 'Resolved',
    severity: 'High'
  },
  {
    id: '4',
    timestamp: '2026-04-08 09:45:12',
    location: 'Bangalore Tech Park',
    event: 'SignEdge Firmware Desync',
    impact: 'Negligible - Local Cache Rendering',
    status: 'Resolved',
    severity: 'Low'
  }
];

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

export const SecurityEventLog: React.FC = () => {
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
            {mockEvents.map((event, idx) => (
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
                    {event.timestamp.split(' ')[1]}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-gray-600" />
                    <span className="text-xs font-bold text-gray-300 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                      {event.location}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-200 font-medium">{event.event}</span>
                    <span className={`inline-flex w-fit mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${severityColors[event.severity]}`}>
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
                    {statusIcons[event.status]}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
