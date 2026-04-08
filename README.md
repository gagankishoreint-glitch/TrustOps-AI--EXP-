# TrustOps AI: Hybrid Intelligence Architecture

TrustOps AI has been upgraded from a synthetic demo to a **Hybrid Intelligence Platform**. The "Brain" is now split into three distinct layers, ensuring the system is fast, mathematically precise, and human-readable.

## 🧠 The Hybrid Architecture

1.  **Reflexes (Isolation Forest)**: Fast anomaly detection trained on historical telemetry. It identifies "something is wrong" in milliseconds and triggers the deeper analysis layers.
2.  **Math (Random Forest)**: Performs the heavy lifting. It classifies the root cause (e.g., "Network Saturation" vs "Unauthorized Access") and runs a regression to predict the **Time-To-Failure (TTF)**.
3.  **Brain (Ollama Llama 3)**: Our GenAI layer. It only activates when the Reflexes spot an anomaly. It takes the mathematical context and generates professional, executive-ready insights for the **Security Copilot**.

---

## 🛠️ Setup & Prerequisite

### 1. AI Model Support (Ollama)
The system uses a local LLM for "Explainable AI."
- **Install Ollama**: [ollama.com](https://ollama.com)
- **Download Model**: Run `ollama run llama3` in your terminal.
- **Service**: Ensure the Ollama service is running in the background while the dashboard is active.

### 2. Machine Learning Dependencies (Python)
The backend requires Python and Scikit-Learn to run the IF/RF models.
```bash
# Recommended: create a virtual environment
pip install scikit-learn pandas joblib
```

### 3. Node Dependencies
Due to the brand-new Vite 7 engine, some legacy plugins require a "legacy" install:
```bash
npm install --legacy-peer-deps
```

---

## 🚀 How to Start

You must run the **Frontend** and the **AI Orchestrator (Backend)** simultaneously.

### Step 1: Start the AI Backend
This orchestrates the Python ML scripts and the Ollama API.
```bash
npm run server:dev
```
*(Runs on http://localhost:5001)*

### Step 2: Start the Dashboard
```bash
npm run dev
```
*(Runs on http://localhost:3000)*

---

## ⚡ Live Demo Walkthrough

### 1. Trigger the "Attack"
While the dashboard is live, press **`Shift + D`**. 
- The **Reflexes** will spot the latency spike.
- The **Math** layer will calculate the exact confidence and TTF.
- The **Brain (Ollama)** will generate a unique security insight.

### 2. Check the "Intelligence"
Click on a node (e.g., "Hyderabad Deccan") to open the **Intelligence Archive**. You will see:
- Real-time **Confidence Meters** (jittering as the AI "thinks").
- A precise **"Breach in ~X Min"** countdown driven by the Random Forest regressor.
- The **Executive Insight** generated specifically for your current anomaly data.

---

## 📝 Developer Notes (Handover)
- **Port Mapping**: The frontend proxies all `/api` calls to port `5001`. Do not change the backend port without updating `vite.config.ts`.
- **Model Files**: The `.joblib` files in `/server` are the trained weights. If you change the dataset in `Panasonic_Showroom_Telecom.csv`, you must run `server/train_hybrid.py` to update them.
- **Production**: For a production build, run `npm run build` then `npm start`.

---
*Maintained by the TrustOps Architecture Team.*