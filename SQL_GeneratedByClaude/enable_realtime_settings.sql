-- Enable Realtime for settings table (so volunteers get live settings updates)
ALTER PUBLICATION supabase_realtime ADD TABLE settings;

-- Verify all realtime tables
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
