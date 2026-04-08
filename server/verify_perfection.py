import pandas as pd
import numpy as np
import joblib
import os
import json
from sklearn.metrics import classification_report

def run_perfection_tests():
    base_dir = os.path.dirname(__file__)
    if_path = os.path.join(base_dir, "isolation_forest.joblib")
    rf_reg_path = os.path.join(base_dir, "random_forest_ttf.joblib")
    rf_clf_path = os.path.join(base_dir, "random_forest_context.joblib")
    
    if not (os.path.exists(if_path) and os.path.exists(rf_reg_path) and os.path.exists(rf_clf_path)):
        print("Error: Models not found. Train them first using train_hybrid.py")
        return

    iso_forest = joblib.load(if_path)
    rf_regressor = joblib.load(rf_reg_path)
    rf_classifier = joblib.load(rf_clf_path)

    print("--- TrustOps AI: Model Perfection Report ---")

    # 1. Test Scenarios (Panasonic Industrial Context)
    scenarios = [
        {"name": "Nominal State", "latency": 20, "cpu": 15, "admin": 0, "expected_anomaly": False},
        {"name": "PLC Memory Corrupt", "latency": 105, "cpu": 82, "admin": 1, "expected_anomaly": True},
        {"name": "Sensor Noise Fail", "latency": 110, "cpu": 85, "admin": 2, "expected_anomaly": True},
        {"name": "C&C Heartbeat", "latency": 420, "cpu": 55, "admin": 15, "expected_anomaly": True},
    ]

    results = []
    for s in scenarios:
        X = pd.DataFrame([{
            "Network_Latency_ms": s["latency"],
            "CPU_Load_Pct": s["cpu"],
            "Admin_Interaction_Count": s["admin"]
        }])
        
        is_anomaly = iso_forest.predict(X)[0] == -1
        context = rf_classifier.predict(X)[0] if is_anomaly else "Healthy"
        ttf = rf_regressor.predict(X)[0] if is_anomaly else 9999
        
        status = "PASSED" if is_anomaly == s["expected_anomaly"] else "FAILED"
        results.append({
            "Scenario": s["name"],
            "Status": status,
            "Anomaly": is_anomaly,
            "Context": context,
            "TTF": round(ttf, 2)
        })

    print(pd.DataFrame(results))
    print("\n--- Summary ---")
    passed = sum(1 for r in results if r["Status"] == "PASSED")
    print(f"Perfection Score: {(passed / len(scenarios)) * 100}%")

if __name__ == "__main__":
    run_perfection_tests()
