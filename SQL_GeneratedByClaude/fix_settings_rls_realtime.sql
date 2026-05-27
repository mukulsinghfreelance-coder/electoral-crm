-- Supabase Realtime checks RLS policies before sending events
-- Volunteers need SELECT permission on settings for their workspace

-- Check current settings RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'settings';

-- Add policy allowing volunteers to read settings for their workspace
DROP POLICY IF EXISTS "volunteers can read workspace settings" ON settings;
CREATE POLICY "volunteers can read workspace settings"
  ON settings FOR SELECT
  USING (
    -- Owner can read
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN customers c ON c.id = w.customer_id
      WHERE c.auth_id = auth.uid()
    )
    OR
    -- Volunteer can read their workspace settings
    workspace_id IN (
      SELECT workspace_id FROM volunteers 
      WHERE email = auth.email()
    )
  );

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'settings';
