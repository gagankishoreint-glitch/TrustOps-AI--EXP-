"""
TrustOps AI — FastAPI Inference Microservice (Model-Standardized)
Architecture: Isolation Forest (Anomaly) + Random Forest (Root Cause + TTF)

Endpoint: POST /analyze
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import pandas as pd
import os
import math
import google.generativeai as genai

app = FastAPI(title="TrustOps AI Service", version="2.1.0")

# Enable CORS for frontend and deployment environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ─── Model Configuration ───────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

# Feature mapping for the 11-dimensional model (backwards compatibility)
FEATURE_COLS = [
    "Network_Latency_ms", "Network_Jitter_ms", "Packet_Loss_Pct",
    "CPU_Load_Pct", "Memory_Usage_MB", "Admin_Interaction_Count",
    "Power_Freq_Hz", "Voltage_Ripple_mV", "Sensor_Humidity_Pct",
    "Temp_Delta_C", "Showroom_Hours_Elapsed"
]

try:
    IF_MODEL    = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.joblib"))
    RF_CLF      = joblib.load(os.path.join(MODEL_DIR, "root_cause_rf.joblib"))
    RF_REG      = joblib.load(os.path.join(MODEL_DIR, "ttf_rf.joblib"))
    print("✅ Models [IF, RF_CLF, RF_REG] loaded correctly.")
except Exception as e:
    print(f"❌ Model load error: {e}")
    IF_MODEL = RF_CLF = RF_REG = None

# ─── Gemini AI Configuration ───────────────────────────────────────────
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "AIzaSyDxnxn1iHSy0mvq9Eu5EYTO1BL9rDxugQU"))
gemini = genai.GenerativeModel('gemini-1.5-flash')

# ─── Schema ────────────────────────────────────────────────────────────

class AnalysisInput(BaseModel):
    latency:           float = Field(..., description="Network latency signal")
    device_frequency:  float = Field(..., description="Hardware/Power frequency")
    user_behaviour:    float = Field(..., description="Interaction/Login signals")
    device_health:     float = Field(..., description="CPU/Resource load signals")
    trend:             float = Field(default=0.0, description="Trend signal (-1 to 1)")

class AnalysisResponse(BaseModel):
    is_anomaly:     bool
    anomaly_score:  float    # Raw decision function output
    trust_score:    int      # 0-100 derived business logic
    root_cause:     str      # Classified failure mode
    ttf_minutes:    float    # Predicted time to failure
    severity:       str      # Medium/High/Critical
    action:         str      # Recommended remediation
    decision:       str      # Conceptual "Decision State"
    advisory:       str      # Executive Summary Text
    risk_level:     str      # High/Medium/Low
    # Predictive Analysis Layer (v2.3 Spec)
    future_risk:         str
    failure_probability: float
    risk_trajectory:     str # Improving / Stable / Degrading
    failure_window:      str # Human Friendly Window
    recommended_action:  str

class ChatRequest(BaseModel):
    message: str
    telemetry: dict
    analysis: dict

class ChatResponse(BaseModel):
    response: str

# ─── Logic ─────────────────────────────────────────────────────────────

def map_to_11_features(inp: AnalysisInput) -> pd.DataFrame:
    """
    Maps 4 incoming conceptual features to the 11-dimensional vector
    the current models expect, using nominal defaults for secondary features.
    """
    data = {
        "Network_Latency_ms":      inp.latency,
        "Network_Jitter_ms":       2.0,     # Clean default
        "Packet_Loss_Pct":        0.0,     # Clean default
        "CPU_Load_Pct":           inp.device_health,
        "Memory_Usage_MB":        1200.0,  # Clean default
        "Admin_Interaction_Count": inp.user_behaviour,
        "Power_Freq_Hz":          inp.device_frequency,
        "Voltage_Ripple_mV":       12.0,    # Clean default
        "Sensor_Humidity_Pct":    45.0,    # Clean default
        "Temp_Delta_C":           1.2,     # Clean default
        "Showroom_Hours_Elapsed":  300.0    # Clean default
    }
    return pd.DataFrame([data], columns=FEATURE_COLS)

def derive_trust_score(is_anomaly: bool, raw_score: float, ttf: float) -> int:
    if not is_anomaly:
        return 98 if raw_score > 0.05 else 85
    
    # Scale: Short TTF + Strong anomaly -> Low trust
    base = 50
    if ttf < 30: base = 15
    elif ttf < 120: base = 35
    
    # Nudge by anomaly strength (-0.5 to 0.0)
    nudge = max(-15, min(15, raw_score * 50))
    return int(max(5, min(65, base + nudge)))

# ─── Operational Intelligence Mapping (Manager Friendly) ────────
RISK_MAP: dict[str, str] = {
    "IoT-23: Mirai Scanning":            "Unusual Network Scanning",
    "IoT-23: C&C Heartbeat Hijack":      "Unauthorized Device Communication",
    "IoT-23: Brute Force Entry":          "Security Authentication Breach",
    "Panasonic: Phase L3 Instability":   "Power Supply Instability",
    "Panasonic: Optical Calibration Drift": "Display Quality Degradation",
    "Panasonic: Heat Sink Failure":       "Critical Unit Overheating",
    "Critical Systemic Fault (Cascading)": "Total Systemic Failure",
    "System Healthy":                     "Nominal Operations",
}

ACTION_MAP: dict[str, str] = {
    "IoT-23: Mirai Scanning":            "Restrict external network ports and monitor incoming traffic.",
    "IoT-23: C&C Heartbeat Hijack":      "Isolate hardware gateway and refresh encrypted credentials.",
    "IoT-23: Brute Force Entry":          "Lock administrative interface and require identity re-verification.",
    "Panasonic: Phase L3 Instability":   "Switch to backup power and alert site maintenance team.",
    "Panasonic: Optical Calibration Drift": "Initiate lens cleaning and automated visual recalibration.",
    "Panasonic: Heat Sink Failure":       "Activate secondary cooling and throttle unit performance.",
    "Critical Systemic Fault (Cascading)": "Immediate physical shutdown and manual inspection required.",
    "System Healthy":                    "No action required. Standard monitoring in progress.",
}

def get_severity_and_action(root_cause: str, is_anomaly: bool):
    if not is_anomaly:
        return "Low", "Continue standard monitoring."
    
    mapping = {
        "IoT-23: Mirai Scanning":            ("High", ACTION_MAP["IoT-23: Mirai Scanning"]),
        "IoT-23: Brute Force Entry":          ("Critical", ACTION_MAP["IoT-23: Brute Force Entry"]),
        "Panasonic: Heat Sink Failure":       ("High", ACTION_MAP["Panasonic: Heat Sink Failure"]),
        "Panasonic: Phase L3 Instability":   ("High", ACTION_MAP["Panasonic: Phase L3 Instability"]),
        "Critical Systemic Fault (Cascading)": ("Critical", ACTION_MAP["Critical Systemic Fault (Cascading)"])
    }
    return mapping.get(root_cause, ("Medium", "Initiate standard diagnostics."))

# ─── Endpoints ─────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "online", "models": IF_MODEL is not None}

@app.post("/analyze", response_model=AnalysisResponse)
def analyze(body: AnalysisInput):
    if IF_MODEL is None:
        raise HTTPException(status_code=503, detail="Models offline")

    # 1. Normalize/Prepare
    X = map_to_11_features(body)

    # 2. Anomaly Detection
    anomaly_score = float(IF_MODEL.decision_function(X)[0])
    is_anomaly    = bool(IF_MODEL.predict(X)[0] == -1)

    # 3. Root Cause Analysis
    root_cause = str(RF_CLF.predict(X)[0])

    # 4. Time to Failure Prediction
    ttf_minutes = float(RF_REG.predict(X)[0])
    
    # 5. Compute Severity & 6. Action
    severity, action = get_severity_and_action(root_cause, is_anomaly)
    
    # 7. Decision Intelligence Layer (v2.2 Spec)
    decision_map = {
        "Critical": "IMMEDIATE ACTION REQUIRED",
        "High":     "PREVENTIVE ACTION",
        "Medium":   "MONITOR",
        "Low":      "STABLE",
        "None":     "STABLE"
    }
    decision = decision_map.get(severity, "STABLE")
    
    risk_level = "Low"
    if severity in ["High", "Critical"]: risk_level = "High"
    elif severity == "Medium" or not is_anomaly: risk_level = "Medium" if is_anomaly else "Low"
    
    friendly_cause = RISK_MAP.get(root_cause, "Unknown anomaly")
    
    # AI Explanation Generator (Manager Friendly Format)
    advisory = (
        f"STATUS: {decision}\n"
        f"CAUSE:  {friendly_cause}\n"
        f"RISK:   {risk_level} Impact - System failure potential high.\n"
        f"ACTION: {action}"
    )

    # 8. Predictive Analysis Layer (v2.3 Spec)
    # Calculate failure probability based on TTF and Anomaly Strength
    # - Short TTF (<30) + strong anomaly (<-0.1) -> ~90% probability
    # - Long TTF (>300) -> ~5% probability
    if not is_anomaly:
        failure_prob = 0.01
    else:
        # Logistic-style decay: p = 1 / (1 + exp( (ttf-60)/30 ))
        # Shifted so that 60 mins -> 50%
        failure_prob = 1.0 / (1.0 + math.exp((ttf_minutes - 60) / 20.0))
        # Nudge by anomaly strength
        failure_prob = max(0.05, min(0.99, failure_prob + (abs(anomaly_score) * 0.5)))

    risk_traj = "Stable"
    if body.trend > 0.1: risk_traj = "Improving"
    elif body.trend < -0.1: risk_traj = "Degrading"
    
    failure_window = "Indeterminate"
    if ttf_minutes < 15: failure_window = "Immediate (<15m)"
    elif ttf_minutes < 60: failure_window = "Near Term (<1h)"
    elif ttf_minutes < 480: failure_window = "Next Shift (<8h)"
    elif ttf_minutes < 10000: failure_window = "Operational (24h+)"

    # Business Logic override for Healthy state
    if not is_anomaly:
        root_cause = "Nominal Operations"
        ttf_minutes = 9999.0
        decision = "STABLE"
        risk_level = "Low"
        advisory = (
            "STATUS: STABLE\n"
            "CAUSE:  Nominal Operations\n"
            "RISK:   None\n"
            "ACTION: No action required."
        )
        failure_prob = 0.01
        risk_traj = "Stable"
        failure_window = "Operational (24h+)"
        recommended_action = "No action required."

    return AnalysisResponse(
        is_anomaly=is_anomaly,
        anomaly_score=round(anomaly_score, 4),
        trust_score=derive_trust_score(is_anomaly, anomaly_score, ttf_minutes),
        root_cause=root_cause,
        ttf_minutes=round(ttf_minutes, 1),
        severity=severity,
        action=action,
        decision=decision,
        advisory=advisory,
        risk_level=risk_level,
        future_risk=f"System Stable" if not is_anomaly else f"{severity} impact predicted within {failure_window}",
        failure_probability=round(failure_prob, 3),
        risk_trajectory=risk_traj,
        failure_window=failure_window,
        recommended_action=recommended_action
    )

@app.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    """
    Grounded Chat Endpoint: Uses Gemini to explain TrustOps decisions.
    """
    try:
        system_prompt = f"""
        You are the TrustOps AI Decision Systems Expert.
        You are looking at the actual telemetry and ML model outputs for a critical industrial segment.
        
        CONTEXT (JSON):
        Telemetry: {body.telemetry}
        ML Analysis: {body.analysis}
        
        RULES:
        1. Use ONLY the provided context. Do NOT hallucinate external facts.
        2. Speak in an operational, manager-friendly tone.
        3. Explain "What is wrong", "What to do", and "How soon" based on 'root_cause', 'action', and 'ttf_minutes'.
        4. If the user asks general questions, politely refocus them on the segment's health.
        5. Keep responses concise (under 3 sentences per point).
        """
        
        full_prompt = f"{system_prompt}\n\nUSER QUESTION: {body.message}"
        response = gemini.generate_content(full_prompt)
        
        return ChatResponse(response=response.text)
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return ChatResponse(response="I am currently experiencing a connection issue with the intelligence core. Please refer to the 'Action' field in the dashboard.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
