-- Function to get workspace owner email (bypasses RLS safely)
-- Called by volunteers during login to show who assigned them
CREATE OR REPLACE FUNCTION get_workspace_owner_email(ws_id uuid)
RETURNS TABLE(owner_name text, owner_email text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT c.name, c.email
  FROM workspaces w
  JOIN customers c ON c.id = w.customer_id
  WHERE w.id = ws_id
  LIMIT 1;
$$;

-- Test
SELECT * FROM get_workspace_owner_email('d7ed242a-a498-4ddf-974b-5b9d90da0cb8');
