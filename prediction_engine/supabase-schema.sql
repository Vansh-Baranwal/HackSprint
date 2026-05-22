-- ============================================================
-- PulseDump Synthetic — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Table: raw_payloads
-- Stores every generated wearable payload as raw JSONB
CREATE TABLE IF NOT EXISTS raw_payloads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider    TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast provider queries
CREATE INDEX IF NOT EXISTS idx_raw_payloads_provider ON raw_payloads(provider);
CREATE INDEX IF NOT EXISTS idx_raw_payloads_received_at ON raw_payloads(received_at DESC);

-- Index for JSONB queries (optional, for advanced querying)
CREATE INDEX IF NOT EXISTS idx_raw_payloads_json ON raw_payloads USING gin(payload_json);

-- Table: sync_logs
-- Stores ingestion status logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status    TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  message   TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- ============================================================
-- Enable Row Level Security (permissive for development)
-- ============================================================

ALTER TABLE raw_payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (no auth needed for this app)
CREATE POLICY "Allow all on raw_payloads" ON raw_payloads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on sync_logs" ON sync_logs
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Enable Realtime for raw_payloads
-- ============================================================
-- Go to: Supabase Dashboard → Database → Replication
-- Enable replication for the raw_payloads table
-- OR run:

ALTER PUBLICATION supabase_realtime ADD TABLE raw_payloads;
ALTER PUBLICATION supabase_realtime ADD TABLE sync_logs;

-- ============================================================
-- Verify
-- ============================================================
SELECT 'raw_payloads created' AS status FROM information_schema.tables
  WHERE table_name = 'raw_payloads';
SELECT 'sync_logs created' AS status FROM information_schema.tables
  WHERE table_name = 'sync_logs';
