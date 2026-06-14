-- Adicionar colunas faltantes na tabela visitor_sessions
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS color_depth INTEGER;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS timezone_offset INTEGER;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS first_url TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS screen_resolution TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS fingerprint_data JSONB;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS x_forwarded_for TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS cf_connecting_ip TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS real_ip TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS ip_public TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS os_type TEXT DEFAULT 'Unknown';
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS os_version TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS browser TEXT DEFAULT 'Unknown';
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS browser_version TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS device_brand TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS device_model TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS is_mobile BOOLEAN DEFAULT FALSE;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS is_tablet BOOLEAN DEFAULT FALSE;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS latitude FLOAT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS longitude FLOAT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE visitor_sessions ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Verificar estrutura final
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'visitor_sessions' ORDER BY ordinal_position;
