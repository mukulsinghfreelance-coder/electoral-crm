-- ─── ELECTORAL CRM — SUPABASE SCHEMA ─────────────────────────────────────────
-- Run this entire file in: Supabase → SQL Editor → New query → Paste → Run

-- ── SETTINGS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state       TEXT DEFAULT 'Bihar',
  ls          TEXT DEFAULT 'Patna Sahib',
  vs          TEXT DEFAULT 'Bankipur',
  total_voters TEXT DEFAULT '',
  total_booths TEXT DEFAULT '',
  mandals     JSONB DEFAULT '[]',
  castes      JSONB DEFAULT '[]',
  parties     JSONB DEFAULT '["BJP+","Congress+","Others+"]',
  elections   JSONB DEFAULT '["Election 2015","Election 2020","Election 2024"]',
  admin_pin   TEXT DEFAULT '1234',
  sheets_url  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row (only if empty)
INSERT INTO settings (state, ls, vs, mandals, castes, parties, elections)
SELECT 'Bihar', 'Patna Sahib', 'Bankipur',
  '[{"name":"Patna Sadar","panchayats":["Gaighat","Rampur"]},{"name":"Danapur","panchayats":["Khagaul","Dinapur"]},{"name":"Bikram","panchayats":["Naubatpur","Bihta"]},{"name":"Phulwari","panchayats":["Shahpur","Maner"]}]',
  '["Yadav","Brahmin","Kurmi","Bhumihar","Rajput","Muslim","Koeri","Dusadh"]',
  '["BJP+","Congress+","Others+"]',
  '["Election 2015","Election 2020","Election 2024"]'
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- ── CONTACTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  wa          TEXT DEFAULT '',
  mandal      TEXT DEFAULT '',
  panchayat   TEXT DEFAULT '',
  village     TEXT DEFAULT '',
  bno         TEXT DEFAULT '',
  bnm         TEXT DEFAULT '',
  tag         TEXT DEFAULT '',
  caste       TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── BOOTHS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booths (
  id          BIGSERIAL PRIMARY KEY,
  bno         TEXT NOT NULL UNIQUE,
  bnm         TEXT DEFAULT '',
  mandal      TEXT DEFAULT '',
  panchayat   TEXT DEFAULT '',
  voters      INTEGER DEFAULT 0,
  rating      TEXT DEFAULT '',
  castes      JSONB DEFAULT '["","",""]',
  elec        JSONB DEFAULT '[{"cast":0,"votes":[0,0,0]},{"cast":0,"votes":[0,0,0]},{"cast":0,"votes":[0,0,0]}]',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUTO UPDATE updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settings_updated  BEFORE UPDATE ON settings  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contacts_updated  BEFORE UPDATE ON contacts  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_booths_updated    BEFORE UPDATE ON booths    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ROW LEVEL SECURITY (open for now, lock down when adding auth) ─────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON settings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON contacts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON booths   FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── INDEXES for fast search ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_phone    ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_mandal   ON contacts(mandal);
CREATE INDEX IF NOT EXISTS idx_contacts_panchayat ON contacts(panchayat);
CREATE INDEX IF NOT EXISTS idx_contacts_tag      ON contacts(tag);
CREATE INDEX IF NOT EXISTS idx_contacts_caste    ON contacts(caste);
CREATE INDEX IF NOT EXISTS idx_booths_bno        ON booths(bno);
CREATE INDEX IF NOT EXISTS idx_booths_panchayat  ON booths(panchayat);

-- Done! You should see 3 tables: settings, contacts, booths

-- Below updates are to support configurable labels to sell it across India.
-- Add labels column to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '{
  "mandal":    "Mandal",
  "panchayat": "Panchayat",
  "booth":     "Booth",
  "village":   "Village",
  "boothName": "Booth Name",
  "caste":     "Caste",
  "tag":       "Tag",
  "contacts":  "Contacts",
  "karyakarta":"Karyakarta"
}';

-- Update existing row with default labels
UPDATE settings SET labels = '{
  "mandal":    "Mandal",
  "panchayat": "Panchayat",
  "booth":     "Booth",
  "village":   "Village",
  "boothName": "Booth Name",
  "caste":     "Caste",
  "tag":       "Tag",
  "contacts":  "Contacts",
  "karyakarta":"Karyakarta",
  "whatsapp": "WhatsApp No."
}' WHERE labels IS NULL;

