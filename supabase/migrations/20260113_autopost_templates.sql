-- Migration: Create autopost_templates table
-- Run this in Supabase SQL Editor

-- Create the autopost_templates table
CREATE TABLE IF NOT EXISTS autopost_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  emoji VARCHAR(10) DEFAULT '📝',
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_autopost_templates_sort ON autopost_templates(sort_order, created_at);

-- Enable RLS
ALTER TABLE autopost_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- Allow everyone to read templates
CREATE POLICY "Templates viewable by all" ON autopost_templates
  FOR SELECT USING (true);

-- Allow authenticated users to manage templates
CREATE POLICY "Templates manageable by authenticated" ON autopost_templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default templates
INSERT INTO autopost_templates (name, description, emoji, content, sort_order) VALUES
  ('Denní report', 'Poznámka + kamera + odkaz', '📢', E'📢 {text_comment}\n\n📸 Pohled z kamery: {kamera}\n\nVíce info 👉 kohutka.ski', 1),
  ('S počasím', 'Počasí + poznámka + nový sníh', '🌤️', E'{pocasi} na Kohútce\n\n📢 {text_comment}\n\n❄️ Nový sníh: {novy_snih}\n\n📸 {kamera}', 2),
  ('Ranní pozvánka', 'Přívětivý ranní pozdrav', '☀️', E'☀️ Dobré ráno z Kohútky!\n\n{text_comment}\n\nPřijeďte si zalyžovat! 🎿\n\n📸 {kamera}', 3),
  ('Stručná', 'Jen poznámka a kamera', '📝', E'{text_comment}\n\n📸 {kamera} | kohutka.ski', 4)
ON CONFLICT DO NOTHING;
