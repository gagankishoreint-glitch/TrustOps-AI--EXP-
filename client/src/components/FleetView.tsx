import React from 'react';
import { Building2, Server, Shield, Activity, Power } from 'lucide-react';

interface Showroom {
  id: string;
  name: string;
  score: number;
  status: string;
  risk: string;
  activeNodes: number;
}

interface FleetViewProps {
  onSelectShowroom: (showroom: string) => void;
  isDemo?: boolean;
}

export const FleetView: React.FC<FleetViewProps> = React.memo(({ onSelectShowroom, isDemo = false }) => {

  const showrooms: Showroom[] = [
    { id: '1', name: 'Showroom A (Tokyo)', score: 98, status: 'Healthy', risk: 'Low', activeNodes: 24 },
    { id: '2', name: 'Showroom B (Osaka)', score: 92, status: 'Healthy', risk: 'Low', activeNodes: 18 },
    { id: '3', name: 'Showroom C (Kyoto) [TEST]', score: isDemo ? 58 : 95, status: isDemo ? 'At Risk' : 'Healthy', risk: isDemo ? 'Critical' : 'Low', activeNodes: 12 },
    { id: '4', name: 'Showroom D (Sapporo)', score: 99, status: 'Healthy', risk: 'Stable', activeNodes: 8 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-cyan-400 bg-cyan-950/20 border-cyan-500/30';
    if (score >= 60) return 'text-yellow-400 bg-yellow-950/20 border-yellow-500/30';
    return 'text-red-500 bg-red-950/20 border-red-500/30';
  };

  return (
    <div className="w-full flex-1">
      <div className="mb-8 border-b border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-cyan-500" />
          Enterprise Fleet Architecture
        </h2>
        <p className="text-gray-400 text-sm mt-1">Select a deployment node to view real-time contextual intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {showrooms.map(room => (
          <div 
            key={room.id}
            onClick={() => onSelectShowroom(room.name)}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-cyan-500/50 hover:bg-gray-800 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-gray-200 group-hover:text-cyan-400 transition-colors">{room.name}</h3>
              <div className={`w-2 h-2 rounded-full ${room.status === 'Healthy' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]'}`}></div>
            </div>

            <div className="flex items-end gap-3 mb-6">
              <div className={`text-4xl font-black ${getScoreColor(room.score).split(' ')[0]}`}>
                {room.score}
              </div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest pb-1">Trust Score</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 flex items-center gap-1"><Server className="w-3 h-3" /> Active Nodes</span>
                <span className="text-gray-300 font-semibold">{room.activeNodes}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 flex items-center gap-1"><Activity className="w-3 h-3" /> Status</span>
                <span className={room.status === 'Healthy' ? 'text-green-400' : 'text-red-400 font-bold'}>{room.status}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Risk Level</span>
                <span className={`px-2 py-0.5 rounded border ${getScoreColor(room.score)}`}>{room.risk}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800">
               <button className="w-full py-2 bg-black/40 border border-gray-800 text-gray-400 text-xs font-bold uppercase tracking-widest rounded group-hover:text-cyan-400 group-hover:border-cyan-900/50 transition-colors flex justify-center items-center gap-2">
                 <Power className="w-3 h-3" /> Drill Down Diagnostics
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
