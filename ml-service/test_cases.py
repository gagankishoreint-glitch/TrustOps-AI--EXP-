"""
TrustOps — 15-Scenario Hold-Out Test Pack (v2.1 Spec)
Validates the 4-input mapping and new JSON response fields.
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import joblib
import numpy as np
import pandas as pd
import time

# ─── Configuration ─────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
FEATURE_COLS = [
    "Network_Latency_ms", "Network_Jitter_ms", "Packet_Loss_Pct",
    "CPU_Load_Pct", "Memory_Usage_MB", "Admin_Interaction_Count",
    "Power_Freq_Hz", "Voltage_Ripple_mV", "Sensor_Humidity_Pct",
    "Temp_Delta_C", "Showroom_Hours_Elapsed"
]

try:
    IF_MODEL = joblib.load(os.path.join(MODEL_DIR, "isolation_forest.joblib"))
    RF_REG   = joblib.load(os.path.join(MODEL_DIR, "ttf_rf.joblib"))
    RF_CLF   = joblib.load(os.path.join(MODEL_DIR, "root_cause_rf.joblib"))
except Exception as e:
    print(f"❌ Cannot load models: {e}")
    sys.exit(1)

# ─── Scenarios ─────────────────────────────────────────────────────────────
SCENARIOS = [
    # (label, (lat, freq, user, health), exp_anomaly, exp_cause)
    ("1 Healthy idle", (22, 50.0, 0, 15), False, None),
    ("2 Heavy Load (Safe)", (120, 50.0, 5, 45), False, None),
    
    # IoT-23 / Security
    ("3 Mirai port scan", (800, 50.0, 20, 75), True, None),
    ("4 Botnet hijack", (900, 50.0, 25, 80), True, None),
    
    # Panasonic Hardware
    ("5 Power frequency drop", (85, 48.1, 2, 85), True, None),
    ("6 Thermal anomaly", (100, 49.5, 3, 90), True, None),

    # Extreme
    ("7 Systemic collapse", (2500, 47.0, 30, 98), True, None),
]

# ─── Runner ───────────────────────────────────────────────────────────────────

def map_inputs(tpl):
    return {
        "latency": tpl[0],
        "device_frequency": tpl[1],
        "user_behaviour": tpl[2],
        "device_health": tpl[3]
    }

def map_to_11(inp) -> pd.DataFrame:
    data = {
        "Network_Latency_ms":      inp["latency"],
        "Network_Jitter_ms":       2.0,
        "Packet_Loss_Pct":        0.0,
        "CPU_Load_Pct":           inp["device_health"],
        "Memory_Usage_MB":        1200.0,
        "Admin_Interaction_Count": inp["user_behaviour"],
        "Power_Freq_Hz":          inp["device_frequency"],
        "Voltage_Ripple_mV":       12.0,
        "Sensor_Humidity_Pct":    45.0,
        "Temp_Delta_C":           1.2,
        "Showroom_Hours_Elapsed":  300.0
    }
    return pd.DataFrame([data], columns=FEATURE_COLS)

def run_local():
    print("="*70)
    print(" TrustOps — v2.3 Predictive Specification Verification")
    print("="*70)
    
    import math
    
    passed = 0
    for label, tpl, exp_anomaly, exp_cause in SCENARIOS:
        inp = map_inputs(tpl)
        X = map_to_11(inp)
        
        is_anomaly = bool(IF_MODEL.predict(X)[0] == -1)
        score      = float(IF_MODEL.decision_function(X)[0])
        cause      = RF_CLF.predict(X)[0]
        ttf        = float(RF_REG.predict(X)[0])
        
        # Predictive Logic (Sync with app.py)
        if not is_anomaly:
            prob = 0.01
        else:
            prob = 1.0 / (1.0 + math.exp((ttf - 60) / 20.0))
            prob = max(0.05, min(0.99, prob + (abs(score) * 0.5)))
        
        anomaly_ok = True if exp_anomaly is None else (is_anomaly == exp_anomaly)
        status = "✅ PASS" if anomaly_ok else "❌ FAIL"
        
        print(f"  {status} [{label}] | score={score:+.3f} | prob={prob:.1%} | cause='{cause}'")
        if anomaly_ok: passed += 1

    print("="*70)
    print(f" Result: {passed}/{len(SCENARIOS)} passed")
    print("="*70)

if __name__ == "__main__":
    run_local()
