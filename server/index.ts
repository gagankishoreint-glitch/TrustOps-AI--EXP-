import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // POST /api/analyze - The Hybrid Intelligence Bridge
  app.post("/api/analyze", (req, res) => {
    const { latency, cpu, adminCount } = req.body;
    
    if (latency === undefined || cpu === undefined || adminCount === undefined) {
      return res.status(400).json({ error: "Missing required telemetry fields." });
    }

    const pythonExecutable = path.resolve(__dirname, "..", ".venv", "bin", "python");
    const inferenceScript = path.resolve(__dirname, "hybrid_inference.py");

    // Phase 1: Reflex & Math (Isolation & Random Forests)
    execFile(pythonExecutable, [inferenceScript, latency.toString(), cpu.toString(), adminCount.toString()], async (error, stdout, stderr) => {
      if (error) {
        console.error("Python Error:", error);
        return res.status(500).json({ error: "Inference Engine failed." });
      }

      try {
        const mlResult = JSON.parse(stdout.trim());
        
        // If not an anomaly, return the baseline prediction
        if (!mlResult.is_anomaly) {
          return res.json({ result: mlResult });
        }

        // Phase 2: The Brain (GenAI Explanation for Anomaly)
        const prompt = `The Predictive ML model (Random Forest) has detected an anomaly.
Context: ${mlResult.context}. 
Time to Failure: ${mlResult.ttf} minutes. 
Recommended Action: ${mlResult.action}.
Write a single, highly professional 1-sentence analytical insight summarizing this for a Chief Information Security Officer dashboard. No introductory phrasing.`;

        let explainableText = mlResult.action; // Fallback

        try {
          // Attempt to call local Ollama for the "Voice"
          const ollamaRes = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama3", // The default requested model, can be overridden by user
              prompt: prompt,
              stream: false
            })
          });
          
          if (ollamaRes.ok) {
            const ollamaData = await ollamaRes.json();
            explainableText = ollamaData.response.trim();
          }
        } catch (ollamaErr) {
          console.warn("Ollama is not reachable, using fallback text.", ollamaErr);
        }

        // Return combined result
        return res.json({
          result: {
            ...mlResult,
            explainable_brain: explainableText
          }
        });

      } catch (parseErr) {
        console.error("Failed to parse ML output:", parseErr);
        return res.status(500).json({ error: "Invalid prediction format." });
      }
    });
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 5001;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
