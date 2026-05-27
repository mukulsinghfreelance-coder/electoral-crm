-- Enable Realtime for contacts and booths tables
-- Required for Supabase Realtime subscriptions to work

ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE booths;

-- Verify
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('contacts', 'booths', 'workspaces', 'settings');
