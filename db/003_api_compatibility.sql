-- Compatibility schema for the existing API routes.
-- Keep the legacy API tables alongside the newer Site Intelligence tables.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- database/schema.sql creates an earlier version of site_assets.
-- Add columns introduced by db/002_site_intelligence.sql when that table already exists.
ALTER TABLE site_assets ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE site_assets ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ;
ALTER TABLE site_assets ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE site_assets ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE site_assets ADD COLUMN IF NOT EXISTS file_uri TEXT;

CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  status TEXT NOT NULL DEFAULT 'open',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS findings_site_id_idx ON findings(site_id);
CREATE INDEX IF NOT EXISTS findings_status_idx ON findings(status);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES findings(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  status TEXT NOT NULL DEFAULT 'new',
  estimated_value NUMERIC(14,2),
  recommended_products JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS opportunities_site_id_idx ON opportunities(site_id);
CREATE INDEX IF NOT EXISTS opportunities_status_idx ON opportunities(status);

CREATE TABLE IF NOT EXISTS evidence_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES findings(id) ON DELETE SET NULL,
  security_object_id UUID REFERENCES site_security_objects(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  title TEXT NOT NULL,
  captured_at TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  mime_type TEXT,
  provenance TEXT,
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  review_state TEXT NOT NULL DEFAULT 'unreviewed',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS evidence_assets_site_id_idx ON evidence_assets(site_id);
CREATE INDEX IF NOT EXISTS evidence_assets_finding_id_idx ON evidence_assets(finding_id);

CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  evidence_id UUID REFERENCES evidence_assets(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  state TEXT NOT NULL DEFAULT 'inferred',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  bounding_box JSONB,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS observations_site_id_idx ON observations(site_id);
CREATE INDEX IF NOT EXISTS observations_state_idx ON observations(state);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running',
  current_step TEXT,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  trace JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS agent_runs_site_id_idx ON agent_runs(site_id);
CREATE INDEX IF NOT EXISTS agent_runs_created_at_idx ON agent_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'sentinel',
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_events_run_id_idx ON audit_events(run_id);
CREATE INDEX IF NOT EXISTS audit_events_site_id_idx ON audit_events(site_id);

CREATE TABLE IF NOT EXISTS provenance_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS provenance_edges_site_id_idx ON provenance_edges(site_id);
CREATE INDEX IF NOT EXISTS provenance_edges_target_idx ON provenance_edges(target_type, target_id);
