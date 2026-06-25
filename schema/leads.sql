-- Cloudflare D1 schema for the Ecco quote-form leads store.
-- One-time setup:
--   1) wrangler d1 create ecco-leads
--   2) In the Pages project: Settings -> Functions -> D1 bindings -> add
--      binding name "DB" pointing at the ecco-leads database.
--   3) wrangler d1 execute ecco-leads --remote --file=schema/leads.sql
--
-- functions/api/submit-quote.js writes here automatically once the DB binding
-- exists (it mirrors the Supabase `leads` shape, upserting on email+service).

CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_number  TEXT,
  email       TEXT NOT NULL,
  first_name  TEXT,
  last_name   TEXT,
  phone       TEXT,
  company     TEXT,
  service     TEXT NOT NULL,
  status      TEXT DEFAULT 'completed',
  form_data   TEXT,                         -- full submission as JSON
  completed_at TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Required for the ON CONFLICT(email, service) upsert in submit-quote.js.
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_service ON leads(email, service);
CREATE INDEX IF NOT EXISTS idx_leads_completed_at ON leads(completed_at);
