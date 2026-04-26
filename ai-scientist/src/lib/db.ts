import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'ai_scientist.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      hypothesis TEXT NOT NULL,
      structured_hypothesis TEXT NOT NULL,
      literature_result TEXT,
      plan TEXT,
      domain TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      section TEXT NOT NULL,
      original_content TEXT NOT NULL,
      corrected_content TEXT NOT NULL,
      correction_type TEXT NOT NULL,
      scientist_note TEXT,
      domain TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (experiment_id) REFERENCES experiments(id)
    );

    CREATE INDEX IF NOT EXISTS idx_feedback_experiment ON feedback(experiment_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_domain ON feedback(domain);
    CREATE INDEX IF NOT EXISTS idx_experiments_domain ON experiments(domain);
  `);
}

export function saveExperiment(data: {
  id: string;
  hypothesis: string;
  structured_hypothesis: object;
  literature_result?: object;
  plan?: object;
  domain: string;
  status: string;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO experiments (id, hypothesis, structured_hypothesis, literature_result, plan, domain, status, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(
    data.id,
    data.hypothesis,
    JSON.stringify(data.structured_hypothesis),
    data.literature_result ? JSON.stringify(data.literature_result) : null,
    data.plan ? JSON.stringify(data.plan) : null,
    data.domain,
    data.status
  );
}

export function getExperiment(id: string) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM experiments WHERE id = ?').get(id) as Record<string, string> | undefined;
  if (!row) return null;
  return {
    ...row,
    structured_hypothesis: JSON.parse(row.structured_hypothesis),
    literature_result: row.literature_result ? JSON.parse(row.literature_result) : null,
    plan: row.plan ? JSON.parse(row.plan) : null,
  };
}

export function listExperiments(limit = 20) {
  const db = getDb();
  const rows = db.prepare('SELECT id, hypothesis, domain, status, created_at, updated_at FROM experiments ORDER BY created_at DESC LIMIT ?').all(limit);
  return rows;
}

export function saveFeedback(data: {
  id: string;
  experiment_id: string;
  section: string;
  original_content: string;
  corrected_content: string;
  correction_type: string;
  scientist_note: string;
  domain: string;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO feedback (id, experiment_id, section, original_content, corrected_content, correction_type, scientist_note, domain)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    data.id,
    data.experiment_id,
    data.section,
    data.original_content,
    data.corrected_content,
    data.correction_type,
    data.scientist_note,
    data.domain
  );
}

export function getFeedbackForExperiment(experimentId: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM feedback WHERE experiment_id = ? ORDER BY created_at DESC').all(experimentId);
}

export function getFeedbackByDomain(domain: string, limit = 10) {
  const db = getDb();
  return db.prepare('SELECT * FROM feedback WHERE domain = ? ORDER BY created_at DESC LIMIT ?').all(domain, limit);
}
