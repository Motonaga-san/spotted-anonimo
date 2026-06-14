-- Tabelas de Monitoramento de Segurança
-- Execute no SQL Editor do Supabase

-- 1. Tabela de dispositivos de rede conhecidos
CREATE TABLE IF NOT EXISTS network_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17),
    hostname VARCHAR(255),
    device_type VARCHAR(50), -- 'router', 'ap', 'phone', 'laptop', 'unknown'
    vendor VARCHAR(100), -- Apple, Samsung, etc
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    ssid VARCHAR(100), -- Rede onde foi visto
    is_suspicious BOOLEAN DEFAULT FALSE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_network_devices_ip ON network_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_network_devices_mac ON network_devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_network_devices_vendor ON network_devices(vendor);

-- 2. Tabela de sessões de visitante expandida
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE NOT NULL,
    
    -- Dados de rede
    ip_address VARCHAR(45) NOT NULL,
    ip_public VARCHAR(45), -- IP público real
    x_forwarded_for TEXT, -- Chain de proxies
    real_ip VARCHAR(45),
    cf_connecting_ip VARCHAR(45), -- Cloudflare
    
    -- Fingerprint
    fingerprint VARCHAR(128),
    fingerprint_data TEXT, -- Dados completos do fingerprint
    
    -- User-Agent detalhado
    user_agent TEXT,
    os_type VARCHAR(50), -- Windows, macOS, Linux, Android, iOS
    os_version VARCHAR(50),
    browser VARCHAR(50),
    browser_version VARCHAR(50),
    device_brand VARCHAR(50),
    device_model VARCHAR(50),
    is_mobile BOOLEAN DEFAULT FALSE,
    is_tablet BOOLEAN DEFAULT FALSE,
    is_bot BOOLEAN DEFAULT FALSE,
    
    -- Localização
    country VARCHAR(10),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    isp VARCHAR(100),
    asn VARCHAR(20),
    
    -- Comportamento
    page_views INTEGER DEFAULT 0,
    spotteds_created INTEGER DEFAULT 0,
    comments_created INTEGER DEFAULT 0,
    likes_given INTEGER DEFAULT 0,
    reports_made INTEGER DEFAULT 0,
    
    -- Classificação
    risk_score INTEGER DEFAULT 0, -- 0-100
    is_suspicious BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    is_attacker BOOLEAN DEFAULT FALSE,
    
    -- Sessão
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Metadados
    first_url TEXT,
    referrer TEXT,
    language VARCHAR(20),
    screen_resolution VARCHAR(20),
    color_depth INTEGER,
    timezone_offset INTEGER
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_ip ON visitor_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_fingerprint ON visitor_sessions(fingerprint);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_suspicious ON visitor_sessions(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_attacker ON visitor_sessions(is_attacker);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_risk ON visitor_sessions(risk_score DESC);

-- 3. Tabela de eventos de segurança
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'attack', 'suspicious', 'banned', 'spam', 'harassment'
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'danger', 'critical'
    
    -- Quem
    session_id VARCHAR(64),
    ip_address VARCHAR(45),
    fingerprint VARCHAR(128),
    user_agent TEXT,
    
    -- O que
    action VARCHAR(100) NOT NULL, -- 'create_spotted', 'create_comment', 'spam', 'harassment'
    target_id UUID, -- ID do spotted/comment afetado
    target_type VARCHAR(50), -- 'spotted', 'comment'
    content_preview TEXT,
    
    -- Contexto
    details JSONB, -- Dados adicionais
    
    -- Classificação
    is_false_positive BOOLEAN DEFAULT FALSE,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_session ON security_events(session_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);

-- 4. Tabela de IPs/fingerprints bloqueados
CREATE TABLE IF NOT EXISTS blocked_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL, -- 'ip', 'fingerprint', 'ip_range'
    entity_value VARCHAR(128) NOT NULL,
    reason TEXT,
    blocked_by VARCHAR(100),
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_permanent BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_blocked_entities_type ON blocked_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_blocked_entities_value ON blocked_entities(entity_value);

-- 5. Tabela de análise de rede local
CREATE TABLE IF NOT EXISTS network_scan_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scan_time TIMESTAMPTZ DEFAULT NOW(),
    network_range VARCHAR(20), -- '10.22.21.0/24'
    
    total_devices INTEGER,
    apple_devices INTEGER,
    suspicious_devices INTEGER,
    
    -- Dispositivos detectados
    devices JSONB, -- Array de dispositivos
    
    -- Metadados
    scanner_ip VARCHAR(45),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_network_scan_time ON network_scan_history(scan_time DESC);

-- 6. Tabela de correlação atacante-rede
CREATE TABLE IF NOT EXISTS attacker_network_correlation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Atacante
    attacker_ip VARCHAR(45),
    attacker_fingerprint VARCHAR(128),
    attacker_user_agent TEXT,
    
    -- Rede
    local_ip VARCHAR(45), -- IP interno se identificado
    mac_address VARCHAR(17),
    ssid VARCHAR(100), -- Rede WiFi
    
    -- Evidência
    attack_sessions TEXT[], -- Array de session IDs
    attack_count INTEGER DEFAULT 0,
    first_attack TIMESTAMPTZ,
    last_attack TIMESTAMPTZ,
    
    -- Status
    confirmed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attacker_correlation_ip ON attacker_network_correlation(attacker_ip);
CREATE INDEX IF NOT EXISTS idx_attacker_correlation_mac ON attacker_network_correlation(mac_address);

-- 7. View de resumo de atacantes
CREATE OR REPLACE VIEW attacker_summary AS
SELECT 
    ip_address,
    fingerprint,
    user_agent,
    os_type,
    COUNT(*) as total_sessions,
    SUM(spotteds_created) as total_spotteds,
    SUM(comments_created) as total_comments,
    MAX(risk_score) as max_risk,
    BOOL_OR(is_attacker) as is_known_attacker,
    MIN(started_at) as first_seen,
    MAX(last_activity) as last_seen
FROM visitor_sessions
GROUP BY ip_address, fingerprint, user_agent, os_type
HAVING BOOL_OR(is_attacker) = TRUE OR SUM(risk_score) > 50
ORDER BY MAX(risk_score) DESC;

-- 8. Função para calcular risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(
    p_ip VARCHAR,
    p_fingerprint VARCHAR,
    p_user_agent TEXT,
    p_content TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
BEGIN
    -- IP já marcado como atacante
    IF EXISTS (SELECT 1 FROM visitor_sessions WHERE ip_address = p_ip AND is_attacker = TRUE) THEN
        v_score := v_score + 50;
    END IF;
    
    -- IP bloqueado
    IF EXISTS (SELECT 1 FROM blocked_entities WHERE entity_type = 'ip' AND entity_value = p_ip AND is_active = TRUE) THEN
        v_score := v_score + 100;
    END IF;
    
    -- Fingerprint já marcado
    IF EXISTS (SELECT 1 FROM visitor_sessions WHERE fingerprint = p_fingerprint AND is_attacker = TRUE) THEN
        v_score := v_score + 40;
    END IF;
    
    -- macOS Catalina (sistema descontinuado, suspeito)
    IF p_user_agent LIKE '%Mac OS X 10_15%' OR p_user_agent LIKE '%Mac OS X 10.15%' THEN
        v_score := v_score + 15;
    END IF;
    
    -- Conteúdo suspeito (harassment, ameaças)
    IF p_content IS NOT NULL THEN
        IF p_content ~* 'morrer|matar|suicidar|idiota|burro|feio|gordo|vadia|puta' THEN
            v_score := v_score + 30;
        END IF;
    END IF;
    
    -- Múltiplas sessões do mesmo fingerprint
    IF (SELECT COUNT(*) FROM visitor_sessions WHERE fingerprint = p_fingerprint) > 5 THEN
        v_score := v_score + 10;
    END IF;
    
    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para auto-classificação
CREATE OR REPLACE FUNCTION auto_classify_visitor()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular risk score
    NEW.risk_score := calculate_risk_score(
        NEW.ip_address,
        NEW.fingerprint,
        NEW.user_agent
    );
    
    -- Marcar como suspeito se score alto
    IF NEW.risk_score >= 50 THEN
        NEW.is_suspicious := TRUE;
    END IF;
    
    -- Se IP ou fingerprint são de atacante conhecido
    IF EXISTS (
        SELECT 1 FROM visitor_sessions 
        WHERE (ip_address = NEW.ip_address OR fingerprint = NEW.fingerprint)
        AND is_attacker = TRUE
    ) THEN
        NEW.is_attacker := TRUE;
        NEW.risk_score := GREATEST(NEW.risk_score, 80);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_classify_visitor ON visitor_sessions;
CREATE TRIGGER trigger_auto_classify_visitor
    BEFORE INSERT ON visitor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION auto_classify_visitor();
