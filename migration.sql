-- ═══════════════════════════════════════════════════════════════════════════════
-- ContactBook — MIGRATION SQL
-- Run this if you already have the old schema (organisations, app_users, workspaces)
-- This safely migrates to the new customer model
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── STEP 1: Create constituency_master (new table, safe to run) ──────────────
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

-- ─── STEP 2: Create customers table (new) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT DEFAULT '',
  plan        TEXT DEFAULT 'free'
              CHECK (plan IN ('free','starter','growth','pro')),
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email   ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_auth_id ON customers(auth_id);

-- ─── STEP 3: Add customer_id to existing workspaces table ────────────────────
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS constituency_id UUID;

-- ─── STEP 4: Add vs/ls/state columns if missing ──────────────────────────────
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS state TEXT DEFAULT '';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS ls    TEXT DEFAULT '';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS vs    TEXT DEFAULT '';

-- ─── STEP 5: Insert your super admin as a customer ────────────────────────────
INSERT INTO customers (name, email, plan)
VALUES ('Super Admin', 'mukulsingh.freelance@gmail.com', 'pro')
ON CONFLICT (email) DO NOTHING;

-- ─── STEP 6: Migrate existing workspaces to the customer ─────────────────────
-- Link all existing workspaces to your super admin customer
UPDATE workspaces
SET customer_id = (SELECT id FROM customers WHERE email = 'mukulsingh.freelance@gmail.com')
WHERE customer_id IS NULL;

-- Copy state/ls/vs from settings into workspaces if empty
UPDATE workspaces w
SET
  state = COALESCE(NULLIF(w.state,''), s.state, ''),
  ls    = COALESCE(NULLIF(w.ls,''), s.ls, ''),
  vs    = COALESCE(NULLIF(w.vs,''), s.vs, w.name, '')
FROM settings s
WHERE s.workspace_id = w.id
  AND (w.state = '' OR w.state IS NULL);

-- ─── STEP 7: Drop old tables (only if you're sure!) ──────────────────────────
-- Comment these out if you want to keep old data as backup
-- DROP TABLE IF EXISTS app_users CASCADE;
-- DROP TABLE IF EXISTS organisations CASCADE;

-- ─── STEP 8: Update RLS on workspaces ────────────────────────────────────────
-- Drop old policies first
DROP POLICY IF EXISTS "anon_all_workspaces" ON workspaces;
DROP POLICY IF EXISTS "anon_all_orgs"       ON organisations;
DROP POLICY IF EXISTS "anon_all_app_users"  ON app_users;

-- New workspace policy using customer_id
CREATE POLICY IF NOT EXISTS "workspaces_own" ON workspaces FOR ALL TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE auth_id = auth.uid()));

-- ─── STEP 9: RLS on new customers table ──────────────────────────────────────
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_own"    ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;

CREATE POLICY "customers_own" ON customers FOR ALL TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "customers_insert" ON customers FOR INSERT TO authenticated
  WITH CHECK (true);

-- ─── STEP 10: RLS on constituency_master ─────────────────────────────────────
ALTER TABLE constituency_master ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cm_read_all"   ON constituency_master;
DROP POLICY IF EXISTS "cm_write_auth" ON constituency_master;

CREATE POLICY "cm_read_all"   ON constituency_master FOR SELECT USING (true);
CREATE POLICY "cm_write_auth" ON constituency_master FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── STEP 11: Update contacts/booths/settings RLS ────────────────────────────
-- Drop old anon policies
DROP POLICY IF EXISTS "Allow all for anon" ON contacts;
DROP POLICY IF EXISTS "Allow all for anon" ON booths;
DROP POLICY IF EXISTS "Allow all for anon" ON settings;

-- New policies via customer_id chain
DROP POLICY IF EXISTS "contacts_own" ON contacts;
CREATE POLICY "contacts_own" ON contacts FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN customers c ON c.id = w.customer_id
    WHERE c.auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "booths_own" ON booths;
CREATE POLICY "booths_own" ON booths FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN customers c ON c.id = w.customer_id
    WHERE c.auth_id = auth.uid()
  ));

DROP POLICY IF EXISTS "settings_own" ON settings;
CREATE POLICY "settings_own" ON settings FOR ALL TO authenticated
  USING (workspace_id IN (
    SELECT w.id FROM workspaces w
    JOIN customers c ON c.id = w.customer_id
    WHERE c.auth_id = auth.uid()
  ));

-- ─── STEP 12: Auto-update trigger for customers ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_updated ON customers;
CREATE TRIGGER trg_customers_updated
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_cm_updated ON constituency_master;
CREATE TRIGGER trg_cm_updated
  BEFORE UPDATE ON constituency_master
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── STEP 13: Fix booths unique constraint (per workspace, not global) ─────────
-- Old constraint was UNIQUE(bno) — now it should be UNIQUE(workspace_id, bno)
ALTER TABLE booths DROP CONSTRAINT IF EXISTS booths_bno_key;
DROP INDEX IF EXISTS booths_bno_key;

-- Add new composite unique constraint
ALTER TABLE booths ADD CONSTRAINT IF NOT EXISTS booths_workspace_bno_unique
  UNIQUE (workspace_id, bno);

-- ─── STEP 14: Bihar constituency data ────────────────────────────────────────
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
('Bihar','Hajipur','Raghopur'),
('Bihar','Maharajganj','Siwan'),
('Bihar','Karakat','Aurangabad'),
('Bihar','Madhepura','Madhepura')
ON CONFLICT (state, lok_sabha, vidhan_sabha) DO NOTHING;

-- ─── DONE ────────────────────────────────────────────────────────────────────
-- Verify with:
-- SELECT COUNT(*) FROM constituency_master;
-- SELECT COUNT(*) FROM customers;
-- SELECT id, name, customer_id, state, ls, vs FROM workspaces;

-- ─── Update plan CHECK constraint in customers table ─────────────────────────
-- Run this in Supabase SQL Editor

-- Step 1: Drop old constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_plan_check;

-- Step 2: Fix all existing rows FIRST (before adding constraint)
UPDATE customers SET plan = 'free' WHERE plan NOT IN ('free','single','multiple');

-- Step 3: Set your account to multiple
UPDATE customers SET plan = 'multiple' WHERE email = 'mukulsingh.freelance@gmail.com';

-- Step 4: NOW add the constraint (data is already clean)
ALTER TABLE customers ADD CONSTRAINT customers_plan_check
  CHECK (plan IN ('free', 'single', 'multiple'));

-- Verify
SELECT email, plan FROM customers;