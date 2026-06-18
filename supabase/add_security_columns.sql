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
