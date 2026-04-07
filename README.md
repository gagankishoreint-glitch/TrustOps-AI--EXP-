# TrustOps AI

TrustOps AI is a cutting-edge **Operational Intelligence Dashboard** designed to solve the problem of alert fatigue in large-scale hardware, IoT, and security ecosystems. Rather than relying on human operators to manually monitor and correlate thousands of telemetry data points (latency, ping frequency, etc.), TrustOps synthesizes live metrics into a unified baseline metric: **The Trust Score**.

With a strong focus on *Management by Exception*, the system operates quietly when health is optimal. When an anomaly occurs across the network or hardware boundaries, the system's GenAI-powered **Security Copilot** instantly interprets the issue and provides operators with clear, executable context—effectively shifting Security Operations from reactive digging to proactive intelligence.

## Features

- **Live Data Telemetry**: High-frequency streaming UI visualizing network metrics without the clutter.
- **The Trust Score**: A dynamic 0-100 metric acting as the central gauge of the entire operational ecosystem's health.
- **Security Copilot**: An automated GenAI assistant that intercepts data anomalies and translates them into plain-English "Insights" and "Automated Actions," mitigating the need for deep log dives.
- **Cyberpunk Aesthetic**: An immersive, high-contrast UI designed for dark-mode command center experiences.

---

## Getting Started

### Local Development
To run this application locally on your machine, clone the repository and install the dependencies using `pnpm`:

```bash
git clone https://github.com/gagankishoreint-glitch/TrustOps-AI.git
cd TrustOps-AI
npm install -g pnpm 
pnpm install
```

Start the Vite development server:
```bash
pnpm dev
```

### Production Build
To create a production bundle and run the finalized Express server locally:
```bash
pnpm build
pnpm start
```

---

## ⚡ Presentation "Demo Mode"
We built a discreet local simulation engine into the production site specifically for live pitches (e.g., panel presentations). This allows you to forcefully demonstrate the AI mitigation process without needing to run the actual backend attack scripts.

**1. Activate Demo Mode**
Append the `?demo=true` parameter to your URL. 
Example: `https://trustops-dashboard.vercel.app/?demo=true`
*(A small yellow "(Demo Mode Active)" indicator will verify you are in the mode).*

**2. Trigger the "Attack"**
While presenting the dashboard to the panel, press **`Shift + D`** on your keyboard. 
This will instantly:
- Spike simulated network latency to >800ms.
- Plunge the Trust Score into the critical red zone.
- Trigger the AI **Security Copilot** to produce an automated DDoS identification insight right before their eyes.

*(Press `Shift + D` again to resolve the simulated attack and return to 100% health).*

---

## Deployment
TrustOps AI is deployed via **Vercel**. Pushing to the `main` branch automatically builds and deploys the Vite Single-Page Application using `vercel.json` rewrite rules.

*Live URL: [https://trustops-dashboard.vercel.app](https://trustops-dashboard.vercel.app)*