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

# ─── Schema ────────────────────────────────────────────────────────────

class AnalysisInput(BaseModel):
    latency:           float = Field(..., description="Network latency signal")
    device_frequency:  float = Field(..., description="Hardware/Power frequency")
    user_behaviour:    float = Field(..., description="Interaction/Login signals")
    device_health:     float = Field(..., description="CPU/Resource load signals")

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
        risk_level=risk_level
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
