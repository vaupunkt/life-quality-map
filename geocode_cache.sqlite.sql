-- SQLite schema for geocode_cache table
CREATE TABLE IF NOT EXISTS geocode_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT,
  lat REAL,
  lng REAL,
  display_name TEXT,
  name TEXT,
  score REAL,
  scoring_properties TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Index for faster lookup by address
CREATE INDEX IF NOT EXISTS idx_geocode_cache_address ON geocode_cache(address);
-- Optional: Index for lat/lng lookup
CREATE INDEX IF NOT EXISTS idx_geocode_cache_latlng ON geocode_cache(lat, lng);
