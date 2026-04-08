import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { saveCase, getSimilarCases } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // Helper for generating Gaussian noise (Industry Scaling)
  const gaussianRandom = (mean: number, stdev: number) => {
    const u = 1 - Math.random(); 
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  };

  // POST /api/analyze - The 11-Dimensional Hybrid Intelligent Layer
  app.post("/api/analyze", (req, res) => {
    const { 
      latency, jitter, ploss, cpu, mem, admin, 
      pfreq, vrip, humid, temp, hours 
    } = req.body;
    
    const pythonExecutable = path.resolve(__dirname, "..", ".venv", "bin", "python");
    const inferenceScript = path.resolve(__dirname, "hybrid_inference.py");

    const args = [
      latency, jitter, ploss, cpu, mem, admin, 
      pfreq, vrip, humid, temp, hours
    ].map(a => a.toString());

    execFile(pythonExecutable, [inferenceScript, ...args], async (error, stdout, stderr) => {
      if (error) {
        console.error("Inference Error:", stderr);
        return res.status(500).json({ error: "Inference Engine failed." });
      }

      try {
        const mlResult = JSON.parse(stdout.trim());
        if (mlResult.error) throw new Error(mlResult.error);
        if (!mlResult.is_anomaly) return res.json({ result: mlResult });

        // Generate Corporate Liability Insight using TrustOps-Expert
        const prompt = `### INFERENCE VECTOR: ${JSON.stringify(req.body)}
### ML PREDICTION: ${mlResult.context} (${mlResult.confidence}% Confidence)

### MISSION: Synthesize a professional industrial advisory for this vector. 
- [RISK]: A snappy 2-word summary.
- [ADVISORY]: A detailed, 10-word technical business action.
DO NOT repeat the same phrase for both.`;

        let explainableText = mlResult.action;

        try {
          const ollamaHost = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
          const ollamaRes = await fetch(`${ollamaHost}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "TrustOps-Expert",
              prompt: prompt,
              stream: false
            })
          });
          
          if (ollamaRes.ok) {
            const ollamaData = await ollamaRes.json();
            explainableText = ollamaData.response.trim();
          }
        } catch (err) {
          console.warn("TrustOps-Expert offline, using fallback.");
        }

        return res.json({
          result: { ...mlResult, explainable_brain: explainableText }
        });

      } catch (parseErr: any) {
        return res.status(500).json({ error: parseErr.message });
      }
    });
  });

  // POST /api/chat - The Expert Advisor with Case Memory
  app.post("/api/chat", async (req, res) => {
    const { messages, contextData } = req.body;

    const similarCases: any = getSimilarCases(
      contextData?.latency || 0,
      contextData?.cpu || 0,
      contextData?.adminCount || 0
    );

    const memoryPrompt = similarCases.length > 0 
      ? `### CASE MEMORY:
Previously, the operator labeled these similar patterns as:
${similarCases.map((c: any) => `- ${c.human_label} (${c.is_accurate ? 'Verified' : 'Overridden'})`).join('\n')}`
      : "### CASE MEMORY: First instance of this behavior in showroom history.";

    try {
      const ollamaHost = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
      const ollamaRes = await fetch(`${ollamaHost}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "TrustOps-Expert",
          prompt: `SYSTEM: ${memoryPrompt}\n\nUSER_QUERY: ${messages[messages.length - 1].content}\n\nADVISORY:`,
          stream: false
        })
      });

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        return res.json({ response: data.response.trim() });
      }
      res.status(500).json({ error: "Expert Advisor is recalibrating." });
    } catch (err) {
      res.status(500).json({ error: "Chat Bridge Failed." });
    }
  });

  app.post("/api/feedback", (req, res) => {
    try {
      saveCase(req.body.caseData);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Feedback Sync Failed" });
    }
  });

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));
  app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));

  const port = process.env.PORT || 5001;
  server.listen(port, () => console.log(`TrustOps Server: http://localhost:${port}/`));
}

startServer().catch(console.error);
