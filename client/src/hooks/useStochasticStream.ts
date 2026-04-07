import { useState, useEffect, useRef } from 'react';

export interface TelemetryPoint {
  timestamp: number;
  latency: number;
  frequency: number;
}

// Standard Box-Muller transform for true Gaussian noise
function gaussianRandom(mean = 0, stdev = 1) {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function useStochasticStream(isSystemStressed: boolean) {
  const [data, setData] = useState<TelemetryPoint[]>([]);
  const lastLatencyRef = useRef<number>(950);

  useEffect(() => {
    // Initialize the rolling window with 20 base points on mount
    const initialData: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 19; i >= 0; i--) {
      initialData.push({
        timestamp: now - i * 2000,
        latency: Math.round(gaussianRandom(950, 15)),
        frequency: Math.round(gaussianRandom(500, 5))
      });
    }
    setData(initialData);

    const interval = setInterval(() => {
      setData((prev) => {
        let newLatency;
        const baseFrequency = Math.round(gaussianRandom(500, 5));
        let newFrequency = baseFrequency;

        if (isSystemStressed) {
          // Random Walk upward toward 2500ms
          const step = 80 + Math.random() * 100;
          newLatency = Math.min(2500, lastLatencyRef.current + step);
          // Frequency violently crashes
          newFrequency = Math.max(0, baseFrequency - (newLatency * 0.2));
        } else {
          // Normal Gaussian jitter
          newLatency = gaussianRandom(950, 15);
        }

        newLatency = Math.round(newLatency);
        newFrequency = Math.round(newFrequency);
        lastLatencyRef.current = newLatency;

        const newDataPoint: TelemetryPoint = {
          timestamp: Date.now(),
          latency: newLatency,
          frequency: newFrequency
        };

        // Maintain Rolling logic of 20 points
        return [...prev.slice(1), newDataPoint];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSystemStressed]);

  return data;
}
