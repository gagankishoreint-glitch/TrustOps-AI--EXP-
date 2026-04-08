import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor, RandomForestClassifier
import joblib
import os

def train_models():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "trustops_panasonic_dataset.csv")
    print(f"Loading dataset from: {dataset_path}")
    
    if not os.path.exists(dataset_path):
        print("Error: Dataset not found. Please run generate_dataset.py first.")
        return
        
    df = pd.read_csv(dataset_path)
    
    # Feature inputs: Network_Latency_ms, CPU_Load_Pct, Admin_Interaction_Count
    X = df[["Network_Latency_ms", "CPU_Load_Pct", "Admin_Interaction_Count"]]
    
    # Let's add simulated historical features for more robust training if we were taking sequences,
    # but for simple inference from single frames we'll train directly on the available stats.
    
    # --- 1. Isolation Forest (Reflexes/Anomaly) ---
    print("Training Isolation Forest (Anomaly Detection)...")
    iso_forest = IsolationForest(contamination=0.2, random_state=42)
    iso_forest.fit(X)
    
    if_path = os.path.join(os.path.dirname(__file__), "isolation_forest.joblib")
    joblib.dump(iso_forest, if_path)
    print(f"Saved Isolation Forest to: {if_path}")
    
    # --- 2. Random Forest Regressor (Math: Time to Failure) ---
    print("Training Random Forest Regressor (TTF)...")
    # For training TTF, we should only look at non-nominal rows or all rows. 
    # The dataset has TTF = 9999 for nominal.
    y_reg = df["Time_to_Failure_mins"]
    rf_regressor = RandomForestRegressor(n_estimators=50, random_state=42)
    rf_regressor.fit(X, y_reg)
    
    rf_reg_path = os.path.join(os.path.dirname(__file__), "random_forest_ttf.joblib")
    joblib.dump(rf_regressor, rf_reg_path)
    print(f"Saved RF Regressor to: {rf_reg_path}")
    
    # --- 3. Random Forest Classifier (Context/Root Cause) ---
    print("Training Random Forest Classifier (Context)...")
    y_clf = df["Anomaly_Context"]
    rf_classifier = RandomForestClassifier(n_estimators=50, random_state=42)
    rf_classifier.fit(X, y_clf)
    
    rf_clf_path = os.path.join(os.path.dirname(__file__), "random_forest_context.joblib")
    joblib.dump(rf_classifier, rf_clf_path)
    print(f"Saved RF Classifier to: {rf_clf_path}")
    
    print("Training Complete!")

if __name__ == "__main__":
    train_models()
