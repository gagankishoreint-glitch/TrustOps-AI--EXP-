/**
 * TrustOps — Local Development Express Server
 *
 * In production: Vercel serves the static frontend + /api/* serverless functions.
 * In local dev:  This server proxies ML requests to the Python microservice and
 *                handles /api/chat with the same template logic.
 *
 * Environment variables:
 *   ML_API_URL   URL of the Python ML microservice (default: http://localhost:8000)
 *   PORT         Express listen port (default: 5001)
 */

import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const ML_API_URL = process.env.ML_API_URL ?? "http://localhost:8000";

// ─── Chat helpers (same logic as api/chat.ts, kept in sync manually) ────────

interface PredictionResult {
  is_anomaly:   boolean;
  trust_score:  number;
  confidence:   number;
  root_cause:   string;
  risk:         string;
  ttf_minutes:  number;
  severity:     string;
  action:       string;
}

function buildChatTemplate(ml: PredictionResult): string {
  if (!ml.is_anomaly) {
    return (
      `The system is operating within normal parameters. ` +
      `Trust score: ${ml.trust_score}/100. No action required.`
    );
  }
  const ttf = ml.ttf_minutes > 8000
    ? "well beyond the monitoring window"
    : `~${Math.round(ml.ttf_minutes)} minutes`;

  return (
    `⚠️ **${ml.risk}** — ${ml.root_cause}.\n\n` +
    `Confidence: **${ml.confidence.toFixed(1)}%** | Trust score: ${ml.trust_score}/100 | Severity: ${ml.severity}\n\n` +
    `**Time to failure:** ${ttf}\n\n` +
    `**Action:** ${ml.action}`
  );
}

// ─── Server ──────────────────────────────────────────────────────────────────

async function startServer() {
  const app    = express();
  const server = createServer(app);

  app.use(express.json());

  // ── POST /api/analyze ─────────────────────────────────────────────────────
  app.post("/api/analyze", async (req, res) => {
    const body = { ...req.body };

    // Normalise field name: frontend sends admin (we fixed Home.tsx)
    // but keep this guard for safety
    if ("adminCount" in body && !("admin" in body)) {
      body.admin = body.adminCount;
      delete body.adminCount;
    }

    try {
      const mlRes = await fetch(`${ML_API_URL}/analyze`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
        signal:  AbortSignal.timeout(10_000),
      });

      if (!mlRes.ok) {
        const err = await mlRes.text();
        return res.status(502).json({ error: `ML service error: ${err}` });
      }

      const mlResult = await mlRes.json();
      return res.json({ result: mlResult });

    } catch (e: any) {
      console.error("[/api/analyze] ML service unreachable:", e.message);
      return res.status(502).json({
        error: "ML service is offline. Start ml-service with: cd ml-service && uvicorn app:app --port 8000"
      });
    }
  });

  // ── POST /api/chat ─────────────────────────────────────────────────────────
  app.post("/api/chat", async (req, res) => {
    const { messages, mlResult } = req.body as {
      messages:  { role: string; content: string }[];
      mlResult?: PredictionResult;
    };

    if (!messages?.length) {
      return res.status(400).json({ error: "messages array is required." });
    }

    if (!mlResult) {
      return res.json({
        response: "No active inference result. Run a telemetry analysis first."
      });
    }

    const templateResponse = buildChatTemplate(mlResult);

    // Optional Ollama enhancement
    const ollamaHost = process.env.OLLAMA_HOST;
    if (ollamaHost) {
      try {
        const userQuestion = messages[messages.length - 1]?.content ?? "";
        const prompt =
          `You are a concise industrial AI advisor. Use ONLY the following inference result.\n\n` +
          `INFERENCE RESULT:\n${JSON.stringify(mlResult, null, 2)}\n\n` +
          `OPERATOR QUESTION: ${userQuestion}\n\n` +
          `ADVISORY (plain English, 3-5 sentences):`;

        const ollamaRes = await fetch(`${ollamaHost}/api/generate`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ model: "TrustOps-Expert", prompt, stream: false }),
          signal:  AbortSignal.timeout(6_000),
        });

        if (ollamaRes.ok) {
          const data = await ollamaRes.json() as { response: string };
          if (data.response?.trim().length > 20) {
            return res.json({ response: data.response.trim() });
          }
        }
      } catch {
        // Ollama offline — fall through
      }
    }

    return res.json({ response: templateResponse });
  });

  // ── POST /api/feedback ─────────────────────────────────────────────────────
  // SQLite removed — in-memory session log only (ephemeral, but keeps UI flow)
  const feedbackLog: any[] = [];

  app.post("/api/feedback", (req, res) => {
    feedbackLog.push({ ts: new Date().toISOString(), ...req.body.caseData });
    // Keep last 200 entries in memory
    if (feedbackLog.length > 200) feedbackLog.shift();
    res.json({ success: true });
  });

  // ── GET /api/health ────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, layer: "express-dev", mlApiUrl: ML_API_URL });
  });

  // ── Static frontend ────────────────────────────────────────────────────────
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));
  app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));

  const port = process.env.PORT || 5001;
  server.listen(port, () =>
    console.log(`\n🚀 TrustOps Dev Server: http://localhost:${port}/`)
  );
  console.log(`   ML Service target: ${ML_API_URL}`);
}

startServer().catch(console.error);
