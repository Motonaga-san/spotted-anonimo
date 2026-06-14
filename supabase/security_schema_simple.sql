-- =============================================
-- SPOTTED SECURITY - SCHEMA SIMPLIFICADO
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Tabela de sessões de visitante
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE NOT NULL,
    
    -- Dados de rede
    ip_address VARCHAR(45) NOT NULL,
    ip_public VARCHAR(45),
    x_forwarded_for TEXT,
    cf_connecting_ip VARCHAR(45),
    
    -- Fingerprint
    fingerprint VARCHAR(128),
    fingerprint_data TEXT,
    
    -- User-Agent
    user_agent TEXT,
    os_type VARCHAR(50),
    os_version VARCHAR(50),
    browser VARCHAR(50),
    browser_version VARCHAR(50),
    device_brand VARCHAR(50),
    device_model VARCHAR(100),
    is_mobile BOOLEAN DEFAULT FALSE,
    is_tablet BOOLEAN DEFAULT FALSE,
    is_bot BOOLEAN DEFAULT FALSE,
    
    -- Localização
    country VARCHAR(10),
    city VARCHAR(100),
    region VARCHAR(100),
    isp VARCHAR(100),
    
    -- Comportamento
    page_views INTEGER DEFAULT 0,
    spotteds_created INTEGER DEFAULT 0,
    comments_created INTEGER DEFAULT 0,
    likes_given INTEGER DEFAULT 0,
    reports_made INTEGER DEFAULT 0,
    
    -- Classificação
    risk_score INTEGER DEFAULT 0,
    is_suspicious BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    is_attacker BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Metadados
    first_url TEXT,
    referrer TEXT,
    language VARCHAR(20),
    screen_resolution VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_ip ON visitor_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_fingerprint ON visitor_sessions(fingerprint);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_attacker ON visitor_sessions(is_attacker);

-- 2. Tabela de eventos de segurança
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

-- 3. Tabela de dispositivos de rede
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

CREATE INDEX IF NOT EXISTS idx_network_devices_ip ON network_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_network_devices_mac ON network_devices(mac_address);

-- 4. Tabela de entidades bloqueadas
CREATE TABLE IF NOT EXISTS blocked_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_value VARCHAR(128) NOT NULL,
    reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_entities_value ON blocked_entities(entity_value);

-- 5. Tabela de correlação atacante-rede
CREATE TABLE IF NOT EXISTS attacker_network_correlation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attacker_ip VARCHAR(45),
    attacker_fingerprint VARCHAR(128),
    local_ip VARCHAR(45),
    mac_address VARCHAR(17),
    ssid VARCHAR(100),
    attack_count INTEGER DEFAULT 0,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS Policies
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE attacker_network_correlation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visitor_sessions_insert" ON visitor_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "visitor_sessions_select" ON visitor_sessions FOR SELECT USING (true);
CREATE POLICY "visitor_sessions_update" ON visitor_sessions FOR UPDATE USING (true);

CREATE POLICY "security_events_insert" ON security_events FOR INSERT WITH CHECK (true);
CREATE POLICY "security_events_select" ON security_events FOR SELECT USING (true);

CREATE POLICY "network_devices_all" ON network_devices FOR ALL USING (true);
CREATE POLICY "blocked_entities_all" ON blocked_entities FOR ALL USING (true);
CREATE POLICY "correlation_all" ON attacker_network_correlation FOR ALL USING (true);

-- 7. View de resumo de atacantes
CREATE OR REPLACE VIEW attacker_summary AS
SELECT 
    ip_address,
    fingerprint,
    user_agent,
    os_type,
    COUNT(*) as total_sessions,
    SUM(spotteds_created) as total_spotteds,
    MAX(risk_score) as max_risk,
    BOOL_OR(is_attacker) as is_known_attacker,
    MIN(started_at) as first_seen,
    MAX(last_activity) as last_seen
FROM visitor_sessions
GROUP BY ip_address, fingerprint, user_agent, os_type
HAVING BOOL_OR(is_attacker) = TRUE OR MAX(risk_score) > 50
ORDER BY MAX(risk_score) DESC;

-- 8. Função para calcular risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(
    p_ip VARCHAR,
    p_fingerprint VARCHAR,
    p_user_agent TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM visitor_sessions WHERE ip_address = p_ip AND is_attacker = TRUE) THEN
        v_score := v_score + 50;
    END IF;
    
    IF EXISTS (SELECT 1 FROM blocked_entities WHERE entity_type = 'ip' AND entity_value = p_ip AND is_active = TRUE) THEN
        v_score := v_score + 100;
    END IF;
    
    IF EXISTS (SELECT 1 FROM visitor_sessions WHERE fingerprint = p_fingerprint AND is_attacker = TRUE) THEN
        v_score := v_score + 40;
    END IF;
    
    IF p_user_agent LIKE '%Mac OS X 10_15%' OR p_user_agent LIKE '%Mac OS X 10.15%' THEN
        v_score := v_score + 15;
    END IF;
    
    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Inserir dispositivo conhecido do atacante
INSERT INTO network_devices (ip_address, mac_address, vendor, device_type, ssid, is_suspicious)
VALUES 
('45.165.93.6', NULL, 'Apple', 'laptop', 'external', true),
('10.22.21.10', NULL, 'Apple', 'laptop', 'Ufibra', true)
ON CONFLICT DO NOTHING;
