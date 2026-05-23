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

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '';

-- Adding Multiletency and login
-- -------------------------------------------------------------------------
-- ─── STEP 1: Enable UUID extension ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── STEP 2: ORGANISATIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organisations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT DEFAULT 'MLA' CHECK (type IN ('MLA','MP','SUPER')),
  owner_phone TEXT,
  owner_email TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STEP 3: WORKSPACES (one per Vidhan Sabha) ───────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organisations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  state       TEXT DEFAULT '',
  ls          TEXT DEFAULT '',
  vs          TEXT DEFAULT '',
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STEP 4: APP USERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id       UUID UNIQUE,              -- links to Supabase Auth user
  name          TEXT NOT NULL,
  phone         TEXT DEFAULT '',
  email         TEXT DEFAULT '',
  role          TEXT DEFAULT 'volunteer'
                CHECK (role IN ('super_admin','admin','volunteer')),
  org_id        UUID REFERENCES organisations(id) ON DELETE CASCADE,
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STEP 5: ADD workspace_id TO EXISTING TABLES ─────────────────────────────
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE booths   ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

-- ─── STEP 6: CREATE DEFAULT ORGANISATION & WORKSPACE ─────────────────────────
-- This is your existing data — assign it to a default workspace

INSERT INTO organisations (id, name, type, owner_email)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Default Organisation',
  'MLA',
  'admin@example.com'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO workspaces (id, org_id, name, state, ls, vs)
VALUES (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Default Workspace',
  'Bihar',
  'Patna Sahib',
  'Bankipur'
) ON CONFLICT (id) DO NOTHING;

-- Assign existing data to default workspace
UPDATE contacts SET workspace_id = 'bbbbbbbb-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE booths   SET workspace_id = 'bbbbbbbb-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE settings SET workspace_id = 'bbbbbbbb-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;

-- ─── STEP 7: INSERT SUPER ADMIN USER ─────────────────────────────────────────
-- Replace with YOUR email
INSERT INTO app_users (name, email, role, org_id, workspace_id)
VALUES (
  'Super Admin',
  'mukulsingh.freelance@gmail.com',   -- ← CHANGE THIS to your email
  'super_admin',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- ─── STEP 8: ROW LEVEL SECURITY ──────────────────────────────────────────────
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users     ENABLE ROW LEVEL SECURITY;

-- Temporarily allow all for anon (we'll tighten after auth works)
CREATE POLICY "anon_all_orgs"       ON organisations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_workspaces" ON workspaces    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_app_users"  ON app_users     FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── STEP 9: INDEXES ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booths_workspace   ON booths(workspace_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email    ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_auth     ON app_users(auth_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_org     ON workspaces(org_id);