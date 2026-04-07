import { useState, useEffect } from 'react';
import { TelemetryPoint } from './useStochasticStream';

export function useInference(dataWindow: TelemetryPoint[]) {
  const [operationalScore, setOperationalScore] = useState(100);
  
  useEffect(() => {
    if (dataWindow.length === 0) return;
    
    // Core Inference Extraction
    const avgLatency = dataWindow.reduce((acc, curr) => acc + curr.latency, 0) / dataWindow.length;
    const peakFrequency = Math.max(...dataWindow.map(d => d.frequency));

    // Trust Model Execution
    // Every 2 seconds (when dataWindow iterates), the inference logic recalculates trajectory
    if (avgLatency > 1500) {
      setOperationalScore(prev => Math.max(0, prev - 5)); // Hard drop
    } else if (avgLatency < 1200) {
       // Organic recovering gradient
       setOperationalScore(prev => Math.min(100, prev + 2)); 
    }
  }, [dataWindow]); 

  return { operationalScore };
}
