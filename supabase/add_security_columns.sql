-- =============================================
-- SPOTTED SECURITY - ADICIONAR COLUNAS FALTANTES
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Adicionar colunas de OS/Browser se não existirem
DO $$ 
BEGIN
    -- Adicionar colunas uma por uma para evitar erros
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'os_type') THEN
        ALTER TABLE visitor_sessions ADD COLUMN os_type VARCHAR(50) DEFAULT 'Unknown';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'os_version') THEN
        ALTER TABLE visitor_sessions ADD COLUMN os_version VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'browser') THEN
        ALTER TABLE visitor_sessions ADD COLUMN browser VARCHAR(50) DEFAULT 'Unknown';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'browser_version') THEN
        ALTER TABLE visitor_sessions ADD COLUMN browser_version VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'device_brand') THEN
        ALTER TABLE visitor_sessions ADD COLUMN device_brand VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'device_model') THEN
        ALTER TABLE visitor_sessions ADD COLUMN device_model VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'is_mobile') THEN
        ALTER TABLE visitor_sessions ADD COLUMN is_mobile BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'is_tablet') THEN
        ALTER TABLE visitor_sessions ADD COLUMN is_tablet BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'is_bot') THEN
        ALTER TABLE visitor_sessions ADD COLUMN is_bot BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'risk_score') THEN
        ALTER TABLE visitor_sessions ADD COLUMN risk_score INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'is_suspicious') THEN
        ALTER TABLE visitor_sessions ADD COLUMN is_suspicious BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'is_attacker') THEN
        ALTER TABLE visitor_sessions ADD COLUMN is_attacker BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'fingerprint') THEN
        ALTER TABLE visitor_sessions ADD COLUMN fingerprint VARCHAR(128);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'fingerprint_data') THEN
        ALTER TABLE visitor_sessions ADD COLUMN fingerprint_data TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'screen_resolution') THEN
        ALTER TABLE visitor_sessions ADD COLUMN screen_resolution VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'color_depth') THEN
        ALTER TABLE visitor_sessions ADD COLUMN color_depth INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'timezone_offset') THEN
        ALTER TABLE visitor_sessions ADD COLUMN timezone_offset INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'language') THEN
        ALTER TABLE visitor_sessions ADD COLUMN language VARCHAR(20);
    END IF;
END $$;

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_ip ON visitor_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_fingerprint ON visitor_sessions(fingerprint);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_attacker ON visitor_sessions(is_attacker);

-- 3. Criar tabela de eventos de segurança se não existir
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    session_id VARCHAR(64),
    ip_address VARCHAR(45),
    fingerprint VARCHAR(128),
    user_agent TEXT,
    action VARCHAR(100) NOT NULL,
    target_id UUID,
    target_type VARCHAR(50),
    content_preview TEXT,
    details JSONB,
    is_false_positive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);

-- 4. Criar tabela de dispositivos de rede se não existir
CREATE TABLE IF NOT EXISTS network_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17),
    hostname VARCHAR(255),
    device_type VARCHAR(50),
    vendor VARCHAR(100),
    ssid VARCHAR(100),
    is_suspicious BOOLEAN DEFAULT FALSE,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar tabela de entidades bloqueadas se não existir
CREATE TABLE IF NOT EXISTS blocked_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_value VARCHAR(128) NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Garantir RLS habilitado
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_entities ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitor_sessions' AND policyname = 'visitor_sessions_insert') THEN
        CREATE POLICY "visitor_sessions_insert" ON visitor_sessions FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitor_sessions' AND policyname = 'visitor_sessions_select') THEN
        CREATE POLICY "visitor_sessions_select" ON visitor_sessions FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visitor_sessions' AND policyname = 'visitor_sessions_update') THEN
        CREATE POLICY "visitor_sessions_update" ON visitor_sessions FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_events' AND policyname = 'security_events_insert') THEN
        CREATE POLICY "security_events_insert" ON security_events FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_events' AND policyname = 'security_events_select') THEN
        CREATE POLICY "security_events_select" ON security_events FOR SELECT USING (true);
    END IF;
END $$;

-- 8. Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'visitor_sessions' 
ORDER BY ordinal_position;

-- =============================================
-- PARTE 2: FINGERPRINTING AVANCADO PARA NETWORK MONITOR
-- =============================================

-- Adicionar colunas de fingerprinting avancado
DO $$ 
BEGIN
    -- Canvas fingerprint hash
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'canvas_hash') THEN
        ALTER TABLE visitor_sessions ADD COLUMN canvas_hash VARCHAR(32);
    END IF;
    
    -- WebGL fingerprint hash
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'webgl_hash') THEN
        ALTER TABLE visitor_sessions ADD COLUMN webgl_hash VARCHAR(32);
    END IF;
    
    -- Audio fingerprint hash
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'audio_hash') THEN
        ALTER TABLE visitor_sessions ADD COLUMN audio_hash VARCHAR(32);
    END IF;
    
    -- Lista de fontes detectadas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'font_list') THEN
        ALTER TABLE visitor_sessions ADD COLUMN font_list TEXT[];
    END IF;
    
    -- Timezone (ex: America/Sao_Paulo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'timezone') THEN
        ALTER TABLE visitor_sessions ADD COLUMN timezone VARCHAR(50);
    END IF;
    
    -- CPU cores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'cpu_cores') THEN
        ALTER TABLE visitor_sessions ADD COLUMN cpu_cores INTEGER;
    END IF;
    
    -- Device memory (GB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'memory') THEN
        ALTER TABLE visitor_sessions ADD COLUMN memory DECIMAL(4,1);
    END IF;
    
    -- Battery level
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'battery_level') THEN
        ALTER TABLE visitor_sessions ADD COLUMN battery_level DECIMAL(3,1);
    END IF;
    
    -- Connection type (4g, wifi, etc)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'connection_type') THEN
        ALTER TABLE visitor_sessions ADD COLUMN connection_type VARCHAR(20);
    END IF;
    
    -- WebRTC local IP (IP interno da rede)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'webrtc_local_ip') THEN
        ALTER TABLE visitor_sessions ADD COLUMN webrtc_local_ip VARCHAR(45);
    END IF;
    
    -- WebRTC public IP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'webrtc_public_ip') THEN
        ALTER TABLE visitor_sessions ADD COLUMN webrtc_public_ip VARCHAR(45);
    END IF;
    
    -- Local IP (same as webrtc_local_ip, kept for compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'local_ip') THEN
        ALTER TABLE visitor_sessions ADD COLUMN local_ip VARCHAR(45);
    END IF;
    
    -- Page views count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'page_views') THEN
        ALTER TABLE visitor_sessions ADD COLUMN page_views INTEGER DEFAULT 1;
    END IF;
    
    -- Likes given count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'likes_given') THEN
        ALTER TABLE visitor_sessions ADD COLUMN likes_given INTEGER DEFAULT 0;
    END IF;
    
    -- WebGL vendor
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'webgl_vendor') THEN
        ALTER TABLE visitor_sessions ADD COLUMN webgl_vendor VARCHAR(100);
    END IF;
    
    -- WebGL renderer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visitor_sessions' AND column_name = 'webgl_renderer') THEN
        ALTER TABLE visitor_sessions ADD COLUMN webgl_renderer VARCHAR(200);
    END IF;
END $$;

-- Criar indices para as novas colunas
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_canvas ON visitor_sessions(canvas_hash);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_webgl ON visitor_sessions(webgl_hash);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_webrtc_local ON visitor_sessions(webrtc_local_ip);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_local_ip ON visitor_sessions(local_ip);

-- Verificar todas as colunas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'visitor_sessions' 
ORDER BY ordinal_position;
