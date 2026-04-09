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
  trend?: number; // Momentum signal (-1.0 to 1.0)
}

export interface AnalysisResult {
  is_anomaly: boolean;
  anomaly_score: number;
  trust_score: number;
  root_cause: string;
  ttf_minutes: number;
  severity: string;
  action: string;
  decision: string;
  advisory: string;
  risk_level: string;
  // Predictive fields (v2.3)
  future_risk: string;
  failure_probability: number;
  risk_trajectory: string;
  failure_window: string;
  recommended_action: string;
}

/**
 * Sends telemetry to the external ML microservice for real-time inference.
 * Maps high-fidelity frontend telemetry to the 4-dimensional conceptual API.
 */
export async function analyzeTelemetry(data: TelemetryData) {
  const payload = {
    latency:          data.latency,
    device_frequency: data.pfreq,         
    user_behaviour:   data.admin,         
    device_health:    data.cpu,           
    trend:            data.trend || 0.0   
  };

  console.log("Sending telemetry", payload);
  const res = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("ML failed");

  const response = await res.json();
  console.log("ML response", response);
  return response;
}

const CHAT_ENDPOINT = (import.meta.env.VITE_ML_ENDPOINT || '').includes('/analyze')
  ? (import.meta.env.VITE_ML_ENDPOINT as string).replace('/analyze', '/chat')
  : '/api/chat';

/**
 * Sends a message to the Gemini-powered TrustOps AI chat.
 * Provides the current telemetry and analysis as context for grounding.
 */
export async function chatWithAI(message: string, context: { telemetry: any, analysis: any }): Promise<string> {
  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, ...context })
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.response;
  } catch (error) {
    console.error('[API] Chat failed:', error);
    return "I am currently unable to reach the intelligence core. Please refer to the remediation advisory for instructions.";
  }
}
