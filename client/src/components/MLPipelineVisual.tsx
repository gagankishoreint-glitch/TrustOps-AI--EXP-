import React, { useEffect, useState } from 'react';
import { Database, Activity, Network, Clock, ShieldCheck, ShieldAlert, ArrowDown } from 'lucide-react';

interface MLPipelineVisualProps {
  isAnalyzing: boolean;
  hasAnomaly: boolean;
  showPredictionUpdate: boolean;
}

export const MLPipelineVisual: React.FC<MLPipelineVisualProps> = ({ isAnalyzing, hasAnomaly, showPredictionUpdate }) => {
  const [activeStep, setActiveStep] = useState<number>(-1);

  // Simulate pipeline progression during the analyzing phase
  useEffect(() => {
    if (isAnalyzing) {
      setActiveStep(0);
      const timer1 = setTimeout(() => setActiveStep(1), 150);
      const timer2 = setTimeout(() => setActiveStep(2), 300);
      const timer3 = setTimeout(() => setActiveStep(3), 450);
      const timer4 = setTimeout(() => setActiveStep(4), 600);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    } else if (showPredictionUpdate) {
      setActiveStep(4);
    } else {
      setActiveStep(-1);
    }
  }, [isAnalyzing, showPredictionUpdate]);

  const steps = [
    { id: 0, label: 'Incoming Telemetry', icon: Database },
    { id: 1, label: 'Isolation Forest', icon: Activity },
    { id: 2, label: 'Random Forest', icon: Network },
    { id: 3, label: 'Predictive TTF', icon: Clock },
    { id: 4, label: 'Decision Output', icon: hasAnomaly ? ShieldAlert : ShieldCheck },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center mb-1">Live Inference Pipeline</p>
      
      <div className="flex flex-col gap-2 relative z-10 w-full items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = activeStep >= step.id;
          const isCurrent = activeStep === step.id;
          const isFinalDecision = step.id === 4;
          const iconColor = isFinalDecision 
            ? (hasAnomaly ? 'text-red-400' : 'text-emerald-400')
            : 'text-cyan-400';
            
          const bgGlow = isFinalDecision
            ? (hasAnomaly ? 'bg-red-500/20 border-red-500/50' : 'bg-emerald-500/20 border-emerald-500/50')
            : 'bg-cyan-500/20 border-cyan-500/50';

          return (
            <React.Fragment key={step.id}>
              <div 
                className={`flex items-center justify-center w-full max-w-[200px] border rounded-lg px-3 py-2 transition-all duration-300 ${
                  isActive ? bgGlow + ' shadow-lg' : 'bg-white/[0.02] border-white/10 opacity-60'
                } ${isCurrent ? 'scale-105 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'scale-100'}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`w-4 h-4 ${isActive ? iconColor : 'text-gray-500'} ${isCurrent ? 'animate-pulse' : ''}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center -my-1.5 z-0">
                  <ArrowDown className={`w-3 h-3 transition-colors duration-300 ${activeStep > step.id ? 'text-cyan-400' : 'text-gray-700'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
