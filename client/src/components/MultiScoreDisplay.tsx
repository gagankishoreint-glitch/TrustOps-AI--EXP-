import React from 'react';
import { Progress } from '@/components/ui/progress';

export interface TrustScores {
  operational: number;
  security: number;
  behavior: number;
  performance: number;
}

interface MultiScoreDisplayProps {
  scores: TrustScores;
}

export const MultiScoreDisplay: React.FC<MultiScoreDisplayProps> = ({ scores }) => {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-cyan-400';
    if (score >= 60) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const getTextColor = (score: number) => {
    if (score >= 80) return 'text-cyan-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-500';
  };

  const ScoreBar = ({ label, score }: { label: string, score: number }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{label}</span>
        <span className={`text-sm font-bold ${getTextColor(score)}`}>{score}</span>
      </div>
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getScoreColor(score)} transition-all duration-500 ease-in-out`} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 rounded-lg p-5 border border-gray-800 mt-4 w-full">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 border-b border-gray-800 pb-2">Sub-Score Breakdown</h3>
      <ScoreBar label="Operational Trust" score={scores.operational} />
      <ScoreBar label="Security Trust" score={scores.security} />
      <ScoreBar label="Behavior Trust" score={scores.behavior} />
      <ScoreBar label="Performance Trust" score={scores.performance} />
    </div>
  );
};
