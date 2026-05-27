-- ═══════════════════════════════════════════════════════════════════════════
-- Add ON DELETE CASCADE foreign keys
-- Ensures deleting a customer/workspace cleans up all related data
-- ═══════════════════════════════════════════════════════════════════════════

-- ── workspaces → customers (already exists, add CASCADE) ─────────────────────
ALTER TABLE workspaces 
  DROP CONSTRAINT IF EXISTS workspaces_customer_id_fkey,
  ADD CONSTRAINT workspaces_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- ── settings → workspaces ────────────────────────────────────────────────────
ALTER TABLE settings
  DROP CONSTRAINT IF EXISTS settings_workspace_id_fkey,
  ADD CONSTRAINT settings_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ── contacts → workspaces ────────────────────────────────────────────────────
ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_workspace_id_fkey,
  ADD CONSTRAINT contacts_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ── booths → workspaces ──────────────────────────────────────────────────────
ALTER TABLE booths
  DROP CONSTRAINT IF EXISTS booths_workspace_id_fkey,
  ADD CONSTRAINT booths_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ── volunteers → workspaces ──────────────────────────────────────────────────
ALTER TABLE volunteers
  DROP CONSTRAINT IF EXISTS volunteers_workspace_id_fkey,
  ADD CONSTRAINT volunteers_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ── billing_history → customers ──────────────────────────────────────────────
ALTER TABLE billing_history
  DROP CONSTRAINT IF EXISTS billing_history_customer_id_fkey,
  ADD CONSTRAINT billing_history_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- ── Verify all cascade constraints ───────────────────────────────────────────
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('workspaces','settings','contacts','booths','volunteers','billing_history')
ORDER BY tc.table_name;
