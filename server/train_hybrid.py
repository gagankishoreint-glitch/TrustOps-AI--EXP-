import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, mean_absolute_error
import joblib
import os

def train_models():
    dataset_path = "trustops_panasonic_dataset.csv"
    print(f"🚀 Loading Industrial Dataset (100k rows): {dataset_path}")
    
    if not os.path.exists(dataset_path):
        print("❌ Error: Dataset not found. Please run generate_dataset.py first.")
        return
        
    df = pd.read_csv(dataset_path)
    
    # NEW 11-DIMENSIONAL FEATURE VECTOR
    features = [
        "Network_Latency_ms", "Network_Jitter_ms", "Packet_Loss_Pct",
        "CPU_Load_Pct", "Memory_Usage_MB", "Admin_Interaction_Count",
        "Power_Freq_Hz", "Voltage_Ripple_mV", "Sensor_Humidity_Pct",
        "Temp_Delta_C", "Showroom_Hours_Elapsed"
    ]
    
    X = df[features]
    
    # --- 1. Isolation Forest (Anomaly Reflex) ---
    print("🧠 Training Anomaly Reflex (Isolation Forest)...")
    iso_forest = IsolationForest(n_estimators=150, contamination='auto', random_state=42)
    iso_forest.fit(X)
    
    if_path = os.path.join(os.path.dirname(__file__), "isolation_forest.joblib")
    joblib.dump(iso_forest, if_path)
    print(f"✅ Saved Isolation Forest to: {if_path}")
    
    # --- 2. Random Forest Regressor (TTF Prediction) ---
    print("📈 Training Time-to-Failure Engine (RF Regressor)...")
    y_reg = df["Time_to_Failure_mins"]
    X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(X, y_reg, test_size=0.2, random_state=42)
    
    rf_regressor = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    rf_regressor.fit(X_train_reg, y_train_reg)
    
    reg_err = mean_absolute_error(y_test_reg, rf_regressor.predict(X_test_reg))
    print(f"📊 TTF Mean Absolute Error: {reg_err:.2f} mins")
    
    rf_reg_path = os.path.join(os.path.dirname(__file__), "random_forest_ttf.joblib")
    joblib.dump(rf_regressor, rf_reg_path)
    print(f"✅ Saved RF Regressor to: {rf_reg_path}")
    
    # --- 3. Random Forest Classifier (Contextual Intelligence) ---
    print("🔍 Training Contextual Engine (RF Classifier)...")
    y_clf = df["Anomaly_Context"]
    X_train_clf, X_test_clf, y_train_clf, y_test_clf = train_test_split(X, y_clf, test_size=0.2, random_state=42)
    
    rf_classifier = RandomForestClassifier(n_estimators=150, max_depth=15, random_state=42)
    rf_classifier.fit(X_train_clf, y_train_clf)
    
    print("\n📝 Classification Report (Industry Scaling Verification):")
    print(classification_report(y_test_clf, rf_classifier.predict(X_test_clf)))
    
    rf_clf_path = os.path.join(os.path.dirname(__file__), "random_forest_context.joblib")
    joblib.dump(rf_classifier, rf_clf_path)
    print(f"✅ Saved RF Classifier to: {rf_clf_path}")
    
    print("\n✨ INDUSTRIAL RE-TRAINING COMPLETE. 11-DIMENSIONAL BRAIN SYNCED.")

if __name__ == "__main__":
    train_models()
