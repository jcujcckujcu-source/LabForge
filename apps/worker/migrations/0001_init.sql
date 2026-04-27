-- LabForge D1 Database Migration
-- Run: npx wrangler d1 execute labforge --file=./migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  api_token  TEXT NOT NULL,
  telegram   TEXT,
  vk         TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lab_reports (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic      TEXT NOT NULL,
  lab_number INTEGER NOT NULL DEFAULT 1,
  lab_json   TEXT NOT NULL,
  r2_key     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_user
  ON lab_reports(user_id, created_at DESC);
