CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS site_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('satellite','aerial','street_view','video','photo','document','social_post','map_layer','other')),
  source TEXT NOT NULL,
  source_url TEXT,
  captured_at TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  file_uri TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_assets_site_id ON site_assets(site_id);
CREATE INDEX IF NOT EXISTS idx_site_assets_type ON site_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_site_assets_location ON site_assets(latitude, longitude);

CREATE TABLE IF NOT EXISTS site_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('vulnerability','existing_security','investigation_required','modernization_opportunity','other')),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low','info')),
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  location GEOMETRY(Point, 4326),
  geometry GEOMETRY(Geometry, 4326),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','validated','dismissed','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_findings_site_id ON site_findings(site_id);
CREATE INDEX IF NOT EXISTS idx_site_findings_location ON site_findings USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_site_findings_geometry ON site_findings USING GIST(geometry);

CREATE TABLE IF NOT EXISTS site_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES site_findings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('new_installation','modernization','replacement','expansion','service','other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  confidence NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  estimated_value NUMERIC(14,2),
  currency CHAR(3) DEFAULT 'EUR',
  recommended_solution JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','qualified','in_progress','won','lost','archived')),
  next_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_opportunities_site_id ON site_opportunities(site_id);
CREATE INDEX IF NOT EXISTS idx_site_opportunities_status ON site_opportunities(status);

CREATE TABLE IF NOT EXISTS site_security_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL CHECK (object_type IN ('vehicle_gate','pedestrian_gate','barrier','road_blocker','turnstile','cctv','anpr','security_cabinet','control_point','fence','parking_equipment','other')),
  name TEXT,
  manufacturer TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'existing' CHECK (status IN ('existing','proposed','removed','unknown')),
  location GEOMETRY(Point, 4326),
  geometry GEOMETRY(Geometry, 4326),
  orientation_degrees NUMERIC(7,2),
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_asset_id UUID REFERENCES site_assets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_security_objects_site_id ON site_security_objects(site_id);
CREATE INDEX IF NOT EXISTS idx_site_security_objects_location ON site_security_objects USING GIST(location);

CREATE TABLE IF NOT EXISTS intelligence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('map','satellite','aerial','street_view','video','photo','social','news','cadastre','open_data','ai','other')),
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  coverage TEXT,
  access_method TEXT,
  licensing_notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
