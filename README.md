# TrustOps AI: Split Deployment Architecture

TrustOps AI has been refactored from a monolithic prototype into a **production-ready microservice architecture**. The system is now decoupled into three core layers for maximum performance, horizontal scalability, and "explainable" security intelligence.

## 🏗️ The Split Architecture

### 1. 🐍 ML Microservice (`/ml-service`)
**Engine**: Python 3.12 + FastAPI + Scikit-Learn.
- **Isolation Forest**: Real-time anomaly gate (Reflexes).
- **Random Forest**: Context classification and TTF regression (Math).
- **Features**: 11-dimensional telemetry vector processing.
- **Scaling**: Containerized via Docker / Railway.

### 2. ⚡ Node.js API Proxy (`/server`)
**Engine**: Express.js + TypeScript.
- Acts as a thin gateway between the frontend and the ML microservice.
- **Chat Wrapper**: Converts raw JSON inference results into human-readable English via grounded templates.
- **Ollama Integration**: Optional GenAI enrichment for executive-ready insights.

### 3. 🖥️ Fleet Dashboard (`/client`)
**Engine**: React + Vite + Framer Motion.
- Real-time visualization of the 11-dimensional telemetry stream.
- **Security Copilot**: AI-driven advisory interface consuming the structured ML output.

---

## 🛠️ Local Setup

### 1. START: ML Microservice
The Python engine must be running for the dashboard to function.
```bash
cd ml-service
# Recommended: create a venv and install deps
pip install -r requirements.txt
uvicorn app:app --port 8000 --reload
```
*Runs on http://localhost:8000*

### 2. START: Node Backend (Proxy)
```bash
pnpm install
npm run server:dev
```
*Runs on http://localhost:5001*

### 3. START: Frontend Dashboard
```bash
npm run dev
```
*Runs on http://localhost:5173*

---

## 🧪 Validation & Testing

We have implemented a **15-Scenario Hold-Out Test Pack** to verify model integrity across various attack vectors (Mirai Scanning, Brute Force, Hardware Drifts).

To run the verification:
```bash
npm run ml:test
```

---

## 🚀 Docker Deployment

To launch the entire stack using Docker Compose:
```bash
docker-compose up --build
```
- **Dashboard**: http://localhost:5173
- **ML API**: http://localhost:8000

---

## 📝 Developer Notes
- **Env Vars**: Create a `.env` file based on `.env.example`.
- **Field Mapping**: The system has been standardized on the `admin` telemetry field across the stack (fixing previous `adminCount` mismatches).
- **GitHub Push**: This architecture is optimized for GitHub/Vercel/Railway deployment. Push the entire root directory to your repository.

---
*Maintained by the TrustOps EXcellence (EXP) Team.*