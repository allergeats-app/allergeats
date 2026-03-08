-- supabase/migrations/001_restaurant_images.sql
-- Cache table for restaurant image enrichment results.
-- Run this in your Supabase SQL editor or via supabase db push.

CREATE TABLE IF NOT EXISTS restaurant_images (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Stable identifier derived from normalized name + address + phone
  cache_key        TEXT UNIQUE NOT NULL,

  restaurant_name  TEXT NOT NULL,

  -- Image data
  image_url        TEXT,
  thumbnail_url    TEXT,
  source           TEXT NOT NULL CHECK (source IN ('website', 'google_places', 'yelp', 'placeholder')),
  source_page_url  TEXT,
  attribution      TEXT,

  -- Match metadata
  confidence       TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  matched_name     TEXT,
  matched_address  TEXT,

  -- Image dimensions (when known from provider)
  width            INTEGER,
  height           INTEGER,

  -- Cache control
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL,
  is_negative      BOOLEAN NOT NULL DEFAULT FALSE  -- TRUE = confirmed no image exists
);

-- Fast lookup by cache key
CREATE INDEX IF NOT EXISTS idx_restaurant_images_cache_key ON restaurant_images(cache_key);

-- For scheduled cleanup of expired rows
CREATE INDEX IF NOT EXISTS idx_restaurant_images_expires_at ON restaurant_images(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE restaurant_images ENABLE ROW LEVEL SECURITY;

-- Service role can read and write (used by server-side API routes)
CREATE POLICY "service_role_all" ON restaurant_images
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Public read access (so client components can query if needed)
CREATE POLICY "public_read" ON restaurant_images
  FOR SELECT
  USING (true);

-- Optional: function to delete expired rows (run via pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION delete_expired_restaurant_images()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM restaurant_images WHERE expires_at < NOW();
$$;

COMMENT ON TABLE restaurant_images IS
  'Cache for restaurant image enrichment results. Positive results expire in 30 days, negative in 7.';
