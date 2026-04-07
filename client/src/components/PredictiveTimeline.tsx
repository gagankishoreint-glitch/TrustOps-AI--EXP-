import React, { useEffect, useState } from 'react';

interface PredictiveTimelineProps {
  currentScore: number;
  isDemo?: boolean;
}

export const PredictiveTimeline: React.FC<PredictiveTimelineProps> = ({ currentScore, isDemo = false }) => {
  const [projections, setProjections] = useState({
    min10: 100,
    min30: 100,
    hour1: 100
  });

  const [timeToFailure, setTimeToFailure] = useState<number | null>(null);

  // Simplified forecasting simulation
  useEffect(() => {
    // If we are under attack / friction (score dropped significantly)
    if (currentScore < 80) {
      if (isDemo) {
        // Controlled decay for presentation purposes 
        setProjections({
          min10: Math.max(0, currentScore - 18),
          min30: Math.max(0, currentScore - 45),
          hour1: 0
        });
        setTimeToFailure(14); // Projected failure in 14 minutes
      } else {
        // Naive trend detection algorithm (Assuming ~ -1.5 slope)
        const slope = -1.5; 
        setProjections({
          min10: Math.max(0, Math.round(currentScore + slope * 10)),
          min30: Math.max(0, Math.round(currentScore + slope * 30)),
          hour1: Math.max(0, Math.round(currentScore + slope * 60))
        });
        setTimeToFailure(Math.round((currentScore - 30) / Math.abs(slope)));
      }
    } else {
      // Healthy state
      setProjections({
        min10: currentScore,
        min30: currentScore,
        hour1: currentScore
      });
      setTimeToFailure(null);
    }
  }, [currentScore, isDemo]);

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-cyan-400 border-cyan-400 bg-cyan-950/30';
    if (score >= 50) return 'text-yellow-400 border-yellow-400 bg-yellow-950/30';
    return 'text-red-500 border-red-500 bg-red-950/30';
  };

  const getStatusText = (score: number) => {
    if (score >= 80) return 'Stable';
    if (score >= 50) return 'Caution';
    return 'Critical';
  };

  const TimelineNode = ({ time, score }: { time: string, score: number }) => (
    <div className="flex flex-col items-center relative z-10">
      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm ${getStatusColor(score)}`}>
        {score}
      </div>
      <p className="text-gray-400 text-xs mt-2">{time}</p>
      <p className={`text-[10px] font-semibold uppercase mt-1 ${getStatusColor(score).split(' ')[0]}`}>
        {getStatusText(score)}
      </p>
    </div>
  );

  return (
    <div className="bg-gray-900 rounded-lg p-5 border border-gray-800 mt-6 w-full relative overflow-hidden">
      <h3 className="text-sm font-semibold text-cyan-400 mb-6 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
        Projected Risk Escalation
      </h3>

      {/* Warning Banner */}
      {timeToFailure !== null && (
        <div className="absolute top-4 right-4 bg-red-950/50 border border-red-500/50 text-red-500 text-xs font-bold px-3 py-1.5 rounded animate-pulse">
          Projected failure in {timeToFailure} minutes
        </div>
      )}

      {/* Timeline Visual */}
      <div className="relative flex justify-between items-start mt-8 px-4">
        {/* Connecting Line */}
        <div className="absolute top-6 left-10 right-10 h-0.5 bg-gray-800 z-0"></div>
        {/* Dynamic Warning Line */}
        {timeToFailure !== null && (
          <div className="absolute top-6 left-10 right-10 h-0.5 bg-gradient-to-r from-yellow-500/50 to-red-500/80 z-0"></div>
        )}

        <TimelineNode time="Now" score={currentScore} />
        <TimelineNode time="+10 min" score={projections.min10} />
        <TimelineNode time="+30 min" score={projections.min30} />
        <TimelineNode time="+1 hour" score={projections.hour1} />
      </div>
    </div>
  );
};
