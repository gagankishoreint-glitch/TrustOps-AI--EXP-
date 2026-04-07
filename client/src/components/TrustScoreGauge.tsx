import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface TrustScoreGaugeProps {
  score: number;
}

export const TrustScoreGauge: React.FC<TrustScoreGaugeProps> = ({ score }) => {
  // Determine color based on score
  let scoreColor = 'text-cyan-400';
  let borderColor = 'border-cyan-400';
  let fillColor = '#06b6d4';
  
  if (score < 50) {
    scoreColor = 'text-red-500';
    borderColor = 'border-red-500';
    fillColor = '#ef4444';
  } else if (score < 80) {
    scoreColor = 'text-yellow-400';
    borderColor = 'border-yellow-400';
    fillColor = '#facc15';
  }

  // Data for the gauge
  const data = [
    { name: 'score', value: score },
    { name: 'remaining', value: 100 - score }
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-64 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              startAngle={180}
              endAngle={0}
              dataKey="value"
            >
              <Cell fill={fillColor} />
              <Cell fill="#1f2937" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-6xl font-bold ${scoreColor} drop-shadow-lg`}>
            {score}
          </div>
          <div className="text-gray-400 text-sm mt-2">Trust Score</div>
        </div>
      </div>

      {/* Status indicator */}
      <div className={`px-4 py-2 rounded border ${borderColor} ${scoreColor}`}>
        {score >= 80 ? 'Operational Healthy' : score >= 50 ? 'Caution' : 'Critical'}
      </div>
    </div>
  );
};
