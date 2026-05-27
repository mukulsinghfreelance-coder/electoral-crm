-- Enable Realtime for workspaces table
-- So WorkspacePage auto-refreshes when Super Admin deletes a VS

ALTER PUBLICATION supabase_realtime ADD TABLE workspaces;
ALTER TABLE workspaces REPLICA IDENTITY FULL;

-- Verify
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
