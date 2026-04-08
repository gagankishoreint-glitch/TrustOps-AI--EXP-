import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'trustops_cases.sqlite');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    location TEXT,
    latency REAL,
    cpu REAL,
    admin_count INTEGER,
    inference_context TEXT,
    human_label TEXT,
    is_accurate INTEGER, -- 1 for YES, 0 for NO
    confidence REAL
  )
`);

export interface CaseRecord {
  location: string;
  latency: number;
  cpu: number;
  adminCount: number;
  inferenceContext: string;
  humanLabel: string;
  isAccurate: boolean;
  confidence: number;
}

export const saveCase = (record: CaseRecord) => {
  const stmt = db.prepare(`
    INSERT INTO cases (location, latency, cpu, admin_count, inference_context, human_label, is_accurate, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    record.location,
    record.latency,
    record.cpu,
    record.adminCount,
    record.inferenceContext,
    record.humanLabel,
    record.isAccurate ? 1 : 0,
    record.confidence
  );
};

export const getSimilarCases = (latency: number, cpu: number, adminCount: number) => {
  // Simple "Similarity" check based on proximity of vectors
  // In a real industrial app, we'd use a vector DB, but for this demo, 
  // we'll look for cases within a ±15% range.
  const range = 0.15;
  const stmt = db.prepare(`
    SELECT * FROM cases 
    WHERE latency BETWEEN ? AND ?
    AND cpu BETWEEN ? AND ?
    AND admin_count = ?
    ORDER BY timestamp DESC LIMIT 5
  `);
  
  return stmt.all(
    latency * (1 - range), latency * (1 + range),
    cpu * (1 - range), cpu * (1 + range),
    adminCount
  );
};

export default db;
