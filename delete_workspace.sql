-- ─── DELETE A WORKSPACE AND ALL ITS DATA ─────────────────────────────────────
-- Run in Supabase SQL Editor
-- Replace the email and VS name below before running

-- ── STEP 1: Preview what will be deleted (run this first!) ───────────────────
SELECT
  w.id          AS workspace_id,
  w.vs          AS vidhan_sabha,
  w.ls          AS lok_sabha,
  w.state,
  c.email       AS customer_email,
  c.plan,
  (SELECT COUNT(*) FROM contacts ct WHERE ct.workspace_id = w.id) AS contacts_count,
  (SELECT COUNT(*) FROM booths b WHERE b.workspace_id = w.id)     AS booths_count
FROM workspaces w
JOIN customers c ON c.id = w.customer_id
WHERE c.email = 'customer@email.com'    -- ← change this
  AND w.vs    = 'Raxaul';              -- ← change this

-- ── STEP 2: Delete (uncomment after confirming Step 1 shows correct row) ─────
-- Contacts, booths, settings delete automatically via ON DELETE CASCADE

-- DELETE FROM workspaces
-- WHERE id = (
--   SELECT w.id FROM workspaces w
--   JOIN customers c ON c.id = w.customer_id
--   WHERE c.email = 'customer@email.com'   -- ← change this
--     AND w.vs    = 'Raxaul'               -- ← change this
-- );

-- ── OPTIONAL: Delete ALL workspaces for a customer ───────────────────────────
-- DELETE FROM workspaces
-- WHERE customer_id = (
--   SELECT id FROM customers WHERE email = 'customer@email.com'
-- );

-- ── OPTIONAL: Delete a customer entirely (removes everything) ─────────────────
-- DELETE FROM customers WHERE email = 'customer@email.com';
