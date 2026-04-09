# 🛡️ TrustOps AI: The Executive Handbook

Welcome to **TrustOps AI**, your digital "guardian" for industrial hardware. Think of this dashboard as a crystal ball that doesn't just watch your systems—it predicts exactly when they might fail and tells you how to fix them before thing go wrong.

---

## 🧠 How the AI Thinks (No Math Required!)

Under the hood, we have three different AI specialists working together 24/7. Here is how they work in plain English:

1.  **💂 The Guard (Isolation Forest)**
    *   **Job**: Detects "Weirdness."
    *   **Analogy**: Like a security guard who knows exactly who belongs in a building. If someone enters wearing a tuxedo and flip-flops, the guard doesn't need to know *why* it's weird, just that it *is* weird.
2.  **👨‍⚕️ The Doctor (Random Forest Classifier)**
    *   **Job**: Diagnoses the Problem.
    *   **Analogy**: Once the guard catches something weird, the Doctor steps in. They look at the symptoms (latency, frequency, user behavior) and say, "Ah, this looks like a Mirai virus spike" or "This is just a hardware drift."
3.  **🔮 The Fortune Teller (Random Forest Regressor)**
    *   **Job**: Predicts the Future (TTF).
    *   **Analogy**: This specialist calculates the trajectory. They tell us, "Based on this fever, the system will likely fail in exactly 26.5 minutes."

---

## 🛠️ Step-by-Step Installation (For Laymen)

Follow these steps in order to get the entire system running on your computer.

### **Phase 1: The Brain (ML Service)**
The AI "Brain" is written in Python. It needs to be running first.
1.  **Open your Terminal** (Command Prompt on Windows, Terminal on Mac).
2.  **Go to the folder**: `cd ml-service`
3.  **Create a safe space**: Run `python -m venv .venv` (This keeps the code clean).
4.  **Enter the space**:
    *   *Mac/Linux*: `source .venv/bin/activate`
    *   *Windows*: `.venv\Scripts\activate`
5.  **Install the software**: `pip install -r requirements.txt` (This downloads the AI libraries).
6.  **Turn on the Brain**: `uvicorn app:app --port 8000 --reload`
    *   *Success Look*: You should see a green message saying `Uvicorn running on http://127.0.0.1:8000`.

### **Phase 2: The Face (Dashboard)**
Now that the brain is on, let's turn on the visual dashboard.
1.  **Open a SECOND Terminal window** (keep the first one running!).
2.  **Go to the main folder**: Make sure you are in the root `trustops-dashboard` folder.
3.  **Prepare the Dashboard**: Run `npm install` (Wait for it to finish).
4.  **Launch the System**: Run `npm run dev`.
5.  **See it in action**: Open your browser (Chrome/Safari) and go to `http://localhost:5173`.

---

## 🚦 Understanding the Status Lights

Look at the top right of your dashboard to see the system health:

*   🟢 **ML ACTIVE**: Everything is perfect! The dashboard is successfully talking to the AI Brain.
*   🔴 **ML OFFLINE**: The dashboard is blind. Ensure you have completed "Phase 1" above and that your black terminal window is still running.
*   🟡 **SIMULATED DEMO**: You are watching a pre-recorded scenario for training purposes.

---

## ❓ Common Questions (FAQ)

**"Where did the needle go?"**
We upgraded the dashboard to a "Digital HUD" (Head-Up Display). The score is now a large number in the center of the arc for faster reading during emergencies.

**"How do I test a critical failure?"**
Click the **Scenario Selector** dropdown in the top right and choose **"Critical Fault"**. The AI will immediately detect the anomaly, trigger the red alert banner, and pop open the Intelligence Explorer.

**"What do I do if I see a red banner?"**
Look at the **"Likely Cause"** and **"Recommended Action"** in the center column. The AI has already calculated the best step for you to take.

---
*Maintained with excellence by the TrustOps Team.*