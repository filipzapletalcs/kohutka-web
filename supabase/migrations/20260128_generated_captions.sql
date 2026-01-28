-- Migration: Create generated_captions table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qtnchzadjrmgfvhfzpzh/sql/new

-- Tabulka pro ukládání vygenerovaných captionů
CREATE TABLE IF NOT EXISTS generated_captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caption TEXT NOT NULL,
  was_published BOOLEAN DEFAULT false,
  weather_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security)
ALTER TABLE generated_captions ENABLE ROW LEVEL SECURITY;

-- Policy pro service role - umožní všechny operace
DROP POLICY IF EXISTS "Allow all for service role" ON generated_captions;
CREATE POLICY "Allow all for service role" ON generated_captions FOR ALL USING (true);

-- Index pro rychlé vyhledávání posledních captionů
CREATE INDEX IF NOT EXISTS idx_generated_captions_created ON generated_captions(created_at DESC);

-- Volitelně: Přidej komentář k tabulce
COMMENT ON TABLE generated_captions IS 'Historie vygenerovaných AI captionů pro Facebook posty';
COMMENT ON COLUMN generated_captions.caption IS 'Finální text příspěvku po korekci';
COMMENT ON COLUMN generated_captions.was_published IS 'True pokud byl caption skutečně publikován na FB';
COMMENT ON COLUMN generated_captions.weather_data IS 'Snapshot podmínek v době generování (JSON)';
