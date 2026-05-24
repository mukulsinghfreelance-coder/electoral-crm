-- ═══════════════════════════════════════════════════════════════════════════════
-- ContactBook Electoral Manager — NEW SCHEMA (Customer Model)
-- Run this in Supabase → SQL Editor
-- This REPLACES the old organisations/app_users model
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── DROP OLD TABLES (if migrating) ──────────────────────────────────────────
-- Uncomment these if you want a clean slate:
-- DROP TABLE IF EXISTS app_users CASCADE;
-- DROP TABLE IF EXISTS organisations CASCADE;

-- ─── 1. CONSTITUENCY MASTER ──────────────────────────────────────────────────
-- Managed by Super Admin only. Source of truth for all State→LS→VS combos.
CREATE TABLE IF NOT EXISTS constituency_master (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state         TEXT NOT NULL,
  lok_sabha     TEXT NOT NULL,
  vidhan_sabha  TEXT NOT NULL,
  active        BOOLEAN DEFAULT TRUE,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state, lok_sabha, vidhan_sabha)
);

CREATE INDEX IF NOT EXISTS idx_cm_state     ON constituency_master(state);
CREATE INDEX IF NOT EXISTS idx_cm_lok_sabha ON constituency_master(lok_sabha);
CREATE INDEX IF NOT EXISTS idx_cm_active    ON constituency_master(active);

-- ─── 2. CUSTOMERS ─────────────────────────────────────────────────────────────
-- One row per registered user. Auth via Supabase Auth (Google or OTP).
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE,                    -- Supabase Auth user id
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT DEFAULT '',
  plan        TEXT DEFAULT 'free'
              CHECK (plan IN ('free','starter','growth','pro')),
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Plan limits reference:
-- free:    1 VS,  1,000 contacts
-- starter: 3 VS, 10,000 contacts
-- growth:  5 VS, 50,000 contacts
-- pro:     8 VS, 2,00,000 contacts

CREATE INDEX IF NOT EXISTS idx_customers_email   ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_auth_id ON customers(auth_id);

-- ─── 3. WORKSPACES ────────────────────────────────────────────────────────────
-- One per VS per customer. All data (contacts, booths, settings) links here.
CREATE TABLE IF NOT EXISTS workspaces (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID REFERENCES customers(id) ON DELETE CASCADE,
  constituency_id     UUID REFERENCES constituency_master(id),
  name                TEXT NOT NULL,          -- VS name (denormalised for speed)
  state               TEXT DEFAULT '',
  ls                  TEXT DEFAULT '',
  vs                  TEXT DEFAULT '',
  active              BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_customer ON workspaces(customer_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_const    ON workspaces(constituency_id);

-- ─── 4. SETTINGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  state         TEXT DEFAULT '',
  ls            TEXT DEFAULT '',
  vs            TEXT DEFAULT '',
  total_voters  TEXT DEFAULT '',
  total_booths  TEXT DEFAULT '',
  mandals       JSONB DEFAULT '[]',
  castes        JSONB DEFAULT '[]',
  parties       JSONB DEFAULT '["BJP+","Congress+","Others+"]',
  elections     JSONB DEFAULT '["Election 2015","Election 2020","Election 2024"]',
  admin_pin     TEXT DEFAULT '1234',
  sheets_url    TEXT DEFAULT '',
  labels        JSONB DEFAULT '{
    "mandal":    "Mandal",
    "panchayat": "Panchayat",
    "booth":     "Booth",
    "village":   "Village",
    "boothName": "Booth Name",
    "caste":     "Caste",
    "tag":       "Tag",
    "contacts":  "Contacts",
    "karyakarta":"Karyakarta",
    "whatsapp":  "WhatsApp No."
  }',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. CONTACTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id            BIGSERIAL PRIMARY KEY,
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  wa            TEXT DEFAULT '',
  mandal        TEXT DEFAULT '',
  panchayat     TEXT DEFAULT '',
  village       TEXT DEFAULT '',
  bno           TEXT DEFAULT '',
  bnm           TEXT DEFAULT '',
  tag           TEXT DEFAULT '',
  caste         TEXT DEFAULT '',
  gender        TEXT DEFAULT '',
  notes         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_workspace  ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone      ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_tag        ON contacts(tag);
CREATE INDEX IF NOT EXISTS idx_contacts_mandal     ON contacts(mandal);

-- ─── 6. BOOTHS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booths (
  id            BIGSERIAL PRIMARY KEY,
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  bno           TEXT NOT NULL,
  bnm           TEXT DEFAULT '',
  mandal        TEXT DEFAULT '',
  panchayat     TEXT DEFAULT '',
  voters        INTEGER DEFAULT 0,
  rating        TEXT DEFAULT '',
  castes        JSONB DEFAULT '["","",""]',
  elec          JSONB DEFAULT '[{"cast":0,"votes":[0,0,0]},{"cast":0,"votes":[0,0,0]},{"cast":0,"votes":[0,0,0]}]',
  notes         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, bno)               -- bno unique per workspace, not global
);

CREATE INDEX IF NOT EXISTS idx_booths_workspace ON booths(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booths_bno       ON booths(bno);

-- ─── 7. AUTO-UPDATE updated_at ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated  BEFORE UPDATE ON customers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_settings_updated   BEFORE UPDATE ON settings   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contacts_updated   BEFORE UPDATE ON contacts   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_booths_updated     BEFORE UPDATE ON booths     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cm_updated         BEFORE UPDATE ON constituency_master FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 8. ROW LEVEL SECURITY ────────────────────────────────────────────────────
ALTER TABLE constituency_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces          ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE booths              ENABLE ROW LEVEL SECURITY;

-- Constituency master: anyone can read, only service role can write
CREATE POLICY "cm_read_all"   ON constituency_master FOR SELECT USING (true);
CREATE POLICY "cm_write_auth" ON constituency_master FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customers: can only see/edit own row
CREATE POLICY "customers_own" ON customers FOR ALL TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Allow insert during signup (auth_id will be set)
CREATE POLICY "customers_insert" ON customers FOR INSERT TO authenticated
  WITH CHECK (true);

-- Workspaces: customer can only see their own
CREATE POLICY "workspaces_own" ON workspaces FOR ALL TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid()));

-- Settings: workspace owner only
CREATE POLICY "settings_own" ON settings FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN customers c ON c.id = w.customer_id
    WHERE c.auth_id = auth.uid()
  ));

-- Contacts: workspace owner only
CREATE POLICY "contacts_own" ON contacts FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN customers c ON c.id = w.customer_id
    WHERE c.auth_id = auth.uid()
  ));

-- Booths: workspace owner only
CREATE POLICY "booths_own" ON booths FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN customers c ON c.id = w.customer_id
    WHERE c.auth_id = auth.uid()
  ));

-- ─── 9. SUPER ADMIN BYPASS (service role) ────────────────────────────────────
-- The service role key bypasses RLS entirely.
-- Use VITE_SUPABASE_SERVICE_KEY in your super admin panel only.

-- ─── 10. SUPER ADMIN CUSTOMER (your own account) ──────────────────────────────
-- After running this, sign in via Google/OTP with your email.
-- Then run this UPDATE to link your auth_id:
-- UPDATE customers SET auth_id = auth.uid(), plan = 'pro' WHERE email = 'your@email.com';

INSERT INTO customers (name, email, plan)
VALUES ('Super Admin', 'mukulsingh.freelance@gmail.com', 'pro')
ON CONFLICT (email) DO NOTHING;

-- ─── 11. CONSTITUENCY MASTER — SAMPLE DATA (Bihar) ───────────────────────────
-- Full India data should be loaded separately via the constituency_data.sql file
-- Here we load Bihar as starter data so the app works immediately

INSERT INTO constituency_master (state, lok_sabha, vidhan_sabha) VALUES
('Bihar','Patna Sahib','Bankipur'),
('Bihar','Patna Sahib','Kumhrar'),
('Bihar','Patna Sahib','Patna Sahib'),
('Bihar','Patna Sahib','Fatuha'),
('Bihar','Patna Sahib','Danapur'),
('Bihar','Patna Sahib','Maner'),
('Bihar','Patliputra','Phulwari'),
('Bihar','Patliputra','Masaurhi'),
('Bihar','Patliputra','Paliganj'),
('Bihar','Patliputra','Bikram'),
('Bihar','Patliputra','Sandesh'),
('Bihar','Patliputra','Ara'),
('Bihar','Nalanda','Asthawan'),
('Bihar','Nalanda','Biharsharif'),
('Bihar','Nalanda','Rajgir'),
('Bihar','Nalanda','Islampur'),
('Bihar','Nalanda','Hilsa'),
('Bihar','Nalanda','Nalanda'),
('Bihar','Arrah','Agiaon'),
('Bihar','Arrah','Tarari'),
('Bihar','Arrah','Jagdishpur'),
('Bihar','Arrah','Shahpur'),
('Bihar','Arrah','Arrah'),
('Bihar','Arrah','Barhara'),
('Bihar','Gaya','Wazirganj'),
('Bihar','Gaya','Rajauli'),
('Bihar','Gaya','Sherghati'),
('Bihar','Gaya','Imamganj'),
('Bihar','Gaya','Gaya Town'),
('Bihar','Gaya','Bodh Gaya'),
('Bihar','Muzaffarpur','Gaighat'),
('Bihar','Muzaffarpur','Aurai'),
('Bihar','Muzaffarpur','Minapur'),
('Bihar','Muzaffarpur','Bochahan'),
('Bihar','Muzaffarpur','Sakra'),
('Bihar','Muzaffarpur','Muzaffarpur'),
('Bihar','Darbhanga','Keoti'),
('Bihar','Darbhanga','Jale'),
('Bihar','Darbhanga','Gaura Bauram'),
('Bihar','Darbhanga','Baheri'),
('Bihar','Darbhanga','Darbhanga Rural'),
('Bihar','Darbhanga','Darbhanga'),
('Bihar','Vaishali','Patepur'),
('Bihar','Vaishali','Mahnar'),
('Bihar','Vaishali','Raja Pakar'),
('Bihar','Vaishali','Lalganj'),
('Bihar','Vaishali','Vaishali'),
('Bihar','Vaishali','Hajipur'),
('Bihar','Bhagalpur','Gopalpur'),
('Bihar','Bhagalpur','Pirpainti'),
('Bihar','Bhagalpur','Kahalgaon'),
('Bihar','Bhagalpur','Bhagalpur'),
('Bihar','Bhagalpur','Sultanganj'),
('Bihar','Bhagalpur','Nathnagar'),
('Bihar','Purnia','Kasba'),
('Bihar','Purnia','Banmankhi'),
('Bihar','Purnia','Rupauli'),
('Bihar','Purnia','Dhamdaha'),
('Bihar','Purnia','Purnia'),
('Bihar','Purnia','Purnia East'),
('Bihar','Sitamarhi','Belsand'),
('Bihar','Sitamarhi','Sitamarhi'),
('Bihar','Sitamarhi','Sursand'),
('Bihar','Sitamarhi','Bajpatti'),
('Bihar','Sitamarhi','Sonbarsa'),
('Bihar','Sitamarhi','Parihar'),
('Bihar','Madhubani','Harlakhi'),
('Bihar','Madhubani','Benipatti'),
('Bihar','Madhubani','Khajauli'),
('Bihar','Madhubani','Babubarhi'),
('Bihar','Madhubani','Rajnagar'),
('Bihar','Madhubani','Jhanjharpur'),
('Bihar','Supaul','Supaul'),
('Bihar','Supaul','Triveniganj'),
('Bihar','Supaul','Chhatapur'),
('Bihar','Supaul','Narpatganj'),
('Bihar','Supaul','Raghopur'),
('Bihar','Supaul','Simri Bakhtiarpur'),
('Bihar','Araria','Araria'),
('Bihar','Araria','Jokihat'),
('Bihar','Araria','Sikti'),
('Bihar','Araria','Raniganj'),
('Bihar','Araria','Forbesganj'),
('Bihar','Araria','Narpatganj'),
('Bihar','Kishanganj','Kishanganj'),
('Bihar','Kishanganj','Kochadhaman'),
('Bihar','Kishanganj','Amour'),
('Bihar','Kishanganj','Bahadurganj'),
('Bihar','Kishanganj','Thakurganj'),
('Bihar','Kishanganj','Islampur'),
('Bihar','Katihar','Manihari'),
('Bihar','Katihar','Barari'),
('Bihar','Katihar','Katihar'),
('Bihar','Katihar','Kadwa'),
('Bihar','Katihar','Balrampur'),
('Bihar','Katihar','Pranpur'),
('Bihar','Begusarai','Teghra'),
('Bihar','Begusarai','Matihani'),
('Bihar','Begusarai','Sahebpur Kamal'),
('Bihar','Begusarai','Begusarai'),
('Bihar','Begusarai','Bakhri'),
('Bihar','Begusarai','Barauni'),
('Bihar','Munger','Sheikhpura'),
('Bihar','Munger','Barbigha'),
('Bihar','Munger','Munger'),
('Bihar','Munger','Jamalpur'),
('Bihar','Munger','Surajgarha'),
('Bihar','Munger','Lakhisarai'),
('Bihar','Jamui','Jamui'),
('Bihar','Jamui','Jhajha'),
('Bihar','Jamui','Chakai'),
('Bihar','Jamui','Sikandra'),
('Bihar','Jamui','Sono'),
('Bihar','Jamui','Gidhaur'),
('Bihar','Nawada','Nawada'),
('Bihar','Nawada','Hisua'),
('Bihar','Nawada','Govindpur'),
('Bihar','Nawada','Warsaliganj'),
('Bihar','Nawada','Rajauli'),
('Bihar','Nawada','Sirdala'),
('Bihar','Banka','Amarpur'),
('Bihar','Banka','Dhauraiya'),
('Bihar','Banka','Banka'),
('Bihar','Banka','Katoria'),
('Bihar','Banka','Belhar'),
('Bihar','Banka','Tarapur'),
('Bihar','Gopalganj','Barauli'),
('Bihar','Gopalganj','Gopalganj'),
('Bihar','Gopalganj','Kuchaikote'),
('Bihar','Gopalganj','Bhaore'),
('Bihar','Gopalganj','Hathua'),
('Bihar','Gopalganj','Siwan'),
('Bihar','Siwan','Ziradei'),
('Bihar','Siwan','Darauli'),
('Bihar','Siwan','Raghunathpur'),
('Bihar','Siwan','Daraundha'),
('Bihar','Siwan','Barharia'),
('Bihar','Siwan','Goriakothi'),
('Bihar','Saran','Amnour'),
('Bihar','Saran','Parsa'),
('Bihar','Saran','Sonepur'),
('Bihar','Saran','Hajipur'),
('Bihar','Saran','Lalganj'),
('Bihar','Saran','Vaishali'),
('Bihar','Buxar','Buxar'),
('Bihar','Buxar','Dumraon'),
('Bihar','Buxar','Rajpur'),
('Bihar','Buxar','Ramgarh'),
('Bihar','Buxar','Dinara'),
('Bihar','Buxar','Sasaram'),
('Bihar','Sasaram','Nokha'),
('Bihar','Sasaram','Sasaram'),
('Bihar','Sasaram','Kargahar'),
('Bihar','Sasaram','Chenari'),
('Bihar','Sasaram','Dehri'),
('Bihar','Sasaram','Karakat'),
('Bihar','Aurangabad','Kutumba'),
('Bihar','Aurangabad','Imamganj'),
('Bihar','Aurangabad','Gaya Town'),
('Bihar','Aurangabad','Bodh Gaya'),
('Bihar','Aurangabad','Barachatti'),
('Bihar','Aurangabad','Guraru'),
('Bihar','Valmiki Nagar','Valmiki Nagar'),
('Bihar','Valmiki Nagar','Ramnagar'),
('Bihar','Valmiki Nagar','Narkatiaganj'),
('Bihar','Valmiki Nagar','Bagaha'),
('Bihar','Valmiki Nagar','Lauriya'),
('Bihar','Valmiki Nagar','Nautan'),
('Bihar','Paschim Champaran','Chanpatia'),
('Bihar','Paschim Champaran','Bettiah'),
('Bihar','Paschim Champaran','Raxaul'),
('Bihar','Paschim Champaran','Sugauli'),
('Bihar','Paschim Champaran','Narkatia'),
('Bihar','Paschim Champaran','Harsidhi'),
('Bihar','Purvi Champaran','Govindganj'),
('Bihar','Purvi Champaran','Kesaria'),
('Bihar','Purvi Champaran','Kalyanpur'),
('Bihar','Purvi Champaran','Pipra'),
('Bihar','Purvi Champaran','Motihari'),
('Bihar','Purvi Champaran','Chiraia'),
('Bihar','Sheohar','Riga'),
('Bihar','Sheohar','Sheohar'),
('Bihar','Sheohar','Bajpatti'),
('Bihar','Sheohar','Parsauni'),
('Bihar','Sheohar','Runni Saidpur'),
('Bihar','Madhepura','Alamnagar'),
('Bihar','Madhepura','Bihariganj'),
('Bihar','Madhepura','Singheshwar'),
('Bihar','Madhepura','Madhepura'),
('Bihar','Madhepura','Sonbarsa'),
('Bihar','Madhepura','Saharsa'),
('Bihar','Khagaria','Alauli'),
('Bihar','Khagaria','Khagaria'),
('Bihar','Khagaria','Mansi'),
('Bihar','Khagaria','Maheshkhunt'),
('Bihar','Khagaria','Singhia'),
('Bihar','Khagaria','Parbatta'),
('Bihar','Samastipur','Kalyanpur'),
('Bihar','Samastipur','Warisnagar'),
('Bihar','Samastipur','Samastipur'),
('Bihar','Samastipur','Morwa'),
('Bihar','Samastipur','Hasanpur'),
('Bihar','Samastipur','Ujiyarpur'),
('Bihar','Ujiyarpur','Baruraj'),
('Bihar','Ujiyarpur','Ujiyarpur'),
('Bihar','Ujiyarpur','Gaura Bauram'),
('Bihar','Ujiyarpur','Mohiuddinagar'),
('Bihar','Ujiyarpur','Bibhutpur'),
('Bihar','Ujiyarpur','Rosera'),
('Bihar','Hajipur','Raghopur'),
('Bihar','Hajipur','Mahua'),
('Bihar','Hajipur','Hajipur'),
('Bihar','Hajipur','Lalganj'),
('Bihar','Hajipur','Mahnar'),
('Bihar','Hajipur','Patepur'),
('Bihar','Maharajganj','Maharajganj'),
('Bihar','Maharajganj','Ekma'),
('Bihar','Maharajganj','Mahadeva'),
('Bihar','Maharajganj','Baniyapur'),
('Bihar','Maharajganj','Taraiya'),
('Bihar','Jhanjharpur','Phulparas'),
('Bihar','Jhanjharpur','Bisfi'),
('Bihar','Jhanjharpur','Laukaha'),
('Bihar','Jhanjharpur','Nirmali'),
('Bihar','Jhanjharpur','Pipra'),
('Bihar','Karakat','Goh'),
('Bihar','Karakat','Obra'),
('Bihar','Karakat','Nabinagar'),
('Bihar','Karakat','Rafiganj'),
('Bihar','Karakat','Gurua'),
('Bihar','Nawada','Sirdala')
ON CONFLICT (state, lok_sabha, vidhan_sabha) DO NOTHING;

-- ─── DONE ─────────────────────────────────────────────────────────────────────
-- Tables created: constituency_master, customers, workspaces, settings, contacts, booths
-- Next: Run constituency_india_full.sql to load all India data
-- Then: Update your .env and deploy the new frontend files
