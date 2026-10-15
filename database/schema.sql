-- Sentinel Autogard / Site Audit
-- PostgreSQL + PostGIS target schema

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  country_code CHAR(2) NOT NULL DEFAULT 'CH',
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  perimeter_meters DOUBLE PRECISION,
  area_square_meters DOUBLE PRECISION,
  perimeter GEOMETRY(Polygon, 4326),
  centroid GEOMETRY(Point, 4326),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sites_perimeter_gix ON sites USING GIST (perimeter);
CREATE INDEX IF NOT EXISTS sites_centroid_gix ON sites USING GIST (centroid);
CREATE INDEX IF NOT EXISTS sites_country_idx ON sites (country_code);
CREATE INDEX IF NOT EXISTS sites_status_idx ON sites (status);

CREATE TABLE IF NOT EXISTS site_layers (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  layer_type TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS site_layers_site_idx ON site_layers (site_id);
CREATE INDEX IF NOT EXISTS site_layers_type_idx ON site_layers (layer_type);

CREATE TABLE IF NOT EXISTS site_assets (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  source TEXT,
  url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS site_assets_site_idx ON site_assets (site_id);
