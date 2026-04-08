/**
 * TrustOps API Client
 * Centralized telemetry analysis and chat logic.
 */

// Use import.meta.env for Vite projects
const ML_ENDPOINT = import.meta.env.VITE_ML_ENDPOINT || '/api/analyze';

export interface TelemetryData {
  latency: number;
  jitter: number;
  ploss: number;
  cpu: number;
  mem: number;
  admin: number;
  pfreq: number;
  vrip: number;
  humid: number;
  temp: number;
  hours: number;
}

export interface AnalysisResult {
  is_anomaly: boolean;
  anomaly_score: number;
  trust_score: number;
  root_cause: string;
  ttf_minutes: number;
  severity: string;
  action: string;
}

/**
 * Sends telemetry to the external ML microservice for real-time inference.
 * Maps high-fidelity frontend telemetry to the 4-dimensional conceptual API.
 */
export async function analyzeTelemetry(data: TelemetryData): Promise<AnalysisResult> {
  // Mapping the 11-dimensional telemetry to the 4-input spec required by ml-service v2.1
  const payload = {
    latency:          data.latency,
    device_frequency: data.pfreq,         // Map Power Freq to conceptual Device Freq
    user_behaviour:   data.admin,         // Map Admin to conceptual User Behaviour
    device_health:    data.cpu            // Map CPU to conceptual Device Health
  };

  try {
    const response = await fetch(ML_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[API] Analysis failed:', error);
    // Return a safe fallback mapping for offline/error states
    return {
      is_anomaly: false,
      anomaly_score: 0.0,
      trust_score: 95,
      root_cause: 'Station Offline',
      ttf_minutes: 9999,
      severity: 'None',
      action: 'Check connectivity to ML service.'
    };
  }
}
