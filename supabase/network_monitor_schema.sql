-- ============================================
-- NETWORK MONITOR SCHEMA - Monitoramento Avançado
-- Para prédio com ~230 pessoas na mesma rede
-- ============================================

-- 1. Tabela de visitantes da mesma rede (IP público compartilhado)
CREATE TABLE IF NOT EXISTS same_network_visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Identificação
    session_id VARCHAR(64) UNIQUE,
    fingerprint VARCHAR(128),
    
    -- IP (mesmo IP público, IPs internos diferentes)
    ip_public VARCHAR(45) NOT NULL,
    ip_internal VARCHAR(45), -- IP local na rede (se detectável)
    x_forwarded_for TEXT, -- Chain de proxies para detectar IPs internos
    
    -- Dispositivo detalhado
    user_agent TEXT,
    os_type VARCHAR(50),
    os_version VARCHAR(50),
    browser VARCHAR(50),
    browser_version VARCHAR(50),
    device_brand VARCHAR(50),
    device_model VARCHAR(50),
    device_type VARCHAR(30), -- smartphone, laptop, tablet, desktop
    screen_resolution VARCHAR(20),
    color_depth INTEGER,
    pixel_ratio DECIMAL(3,2),
    
    -- Fingerprint avançado
    canvas_fingerprint VARCHAR(64),
    webgl_fingerprint VARCHAR(64),
    audio_fingerprint VARCHAR(64),
    font_fingerprint TEXT,
    plugin_fingerprint TEXT,
    hardware_concurrency INTEGER, -- CPU cores
    device_memory INTEGER, -- RAM em GB
    battery_level DECIMAL(5,2),
    is_charging BOOLEAN,
    
    -- Comportamento na rede
    first_visit TIMESTAMPTZ DEFAULT NOW(),
    last_visit TIMESTAMPTZ DEFAULT NOW(),
    total_visits INTEGER DEFAULT 1,
    total_page_views INTEGER DEFAULT 0,
    total_spotteds INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    
    -- Padrões comportamentais
    avg_session_duration INTEGER, -- em segundos
    preferred_hours INTEGER[], -- horas do dia mais ativas [9, 12, 18]
    pages_visited TEXT[], -- ['/', '/stats', '/admin']
    
    -- Localização interna (se detectável)
    probable_floor INTEGER, -- Andar provável
    probable_apartment VARCHAR(10),
    wifi_ssid VARCHAR(100),
    wifi_bssid VARCHAR(17), -- MAC do roteador
    
    -- Classificação
    is_known_attacker BOOLEAN DEFAULT FALSE,
    is_suspicious BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0,
    
    -- Metadados
    language VARCHAR(20),
    timezone VARCHAR(50),
    timezone_offset INTEGER,
    do_not_track BOOLEAN,
    cookies_enabled BOOLEAN,
    local_storage_enabled BOOLEAN,
    
    -- Dados raw para análise
    raw_headers JSONB,
    raw_navigator JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_same_network_ip_public ON same_network_visitors(ip_public);
CREATE INDEX IF NOT EXISTS idx_same_network_fingerprint ON same_network_visitors(fingerprint);
CREATE INDEX IF NOT EXISTS idx_same_network_device ON same_network_visitors(device_brand, device_model);
CREATE INDEX IF NOT EXISTS idx_same_network_attacker ON same_network_visitors(is_known_attacker);
CREATE INDEX IF NOT EXISTS idx_same_network_suspicious ON same_network_visitors(is_suspicious);

-- 2. Tabela de sessões de atividade
CREATE TABLE IF NOT EXISTS network_activity_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES same_network_visitors(id),
    session_id VARCHAR(64),
    
    -- Tempo
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Atividade
    page_views INTEGER DEFAULT 0,
    spotteds_created INTEGER DEFAULT 0,
    comments_created INTEGER DEFAULT 0,
    likes_given INTEGER DEFAULT 0,
    
    -- Páginas visitadas
    pages JSONB, -- [{"path": "/", "time": "2024-01-01T10:00:00Z", "duration": 30}, ...]
    
    -- Dispositivo na sessão
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_sessions_visitor ON network_activity_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_time ON network_activity_sessions(started_at DESC);

-- 3. Tabela de padrões de uso (analytics avançado)
CREATE TABLE IF NOT EXISTS network_usage_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES same_network_visitors(id),
    
    -- Período de análise
    period_start DATE,
    period_end DATE,
    
    -- Estatísticas
    total_sessions INTEGER DEFAULT 0,
    total_time_seconds BIGINT DEFAULT 0,
    avg_session_duration INTEGER,
    
    -- Horários preferidos (hora -> contagem)
    hourly_activity JSONB, -- {"9": 5, "10": 12, "11": 8, ...}
    
    -- Dias da semana preferidos
    weekday_activity JSONB, -- {"monday": 15, "tuesday": 20, ...}
    
    -- Conteúdos criados
    spotteds_created INTEGER DEFAULT 0,
    comments_created INTEGER DEFAULT 0,
    
    -- Padrões detectados
    is_regular_visitor BOOLEAN DEFAULT FALSE, -- Visita frequentemente
    is_spammer BOOLEAN DEFAULT FALSE, -- Muitos posts em pouco tempo
    is_night_owl BOOLEAN DEFAULT FALSE, -- Ativo de madrugada
    is_active_during_work BOOLEAN DEFAULT FALSE, -- Ativo em horário comercial
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de correlação entre visitantes
CREATE TABLE IF NOT EXISTS visitor_correlations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    visitor_1_id UUID REFERENCES same_network_visitors(id),
    visitor_2_id UUID REFERENCES same_network_visitors(id),
    
    -- Correlações detectadas
    same_device BOOLEAN DEFAULT FALSE, -- Mesmo fingerprint
    same_os_browser BOOLEAN DEFAULT FALSE,
    similar_behavior BOOLEAN DEFAULT FALSE,
    
    -- Similaridade
    fingerprint_similarity DECIMAL(5,4), -- 0.0 a 1.0
    behavior_similarity DECIMAL(5,4),
    
    -- Evidências
    correlation_evidence JSONB, -- {"shared_ips": ["10.22.20.1"], "similar_hours": true}
    
    -- Probabilidade de serem a mesma pessoa
    same_person_probability DECIMAL(5,4),
    
    first_detected TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_correlations_visitor1 ON visitor_correlations(visitor_1_id);
CREATE INDEX IF NOT EXISTS idx_correlations_visitor2 ON visitor_correlations(visitor_2_id);

-- 5. Tabela de detecções de dispositivos na rede
CREATE TABLE IF NOT EXISTS network_device_detections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Dispositivo detectado
    fingerprint VARCHAR(128),
    device_signature VARCHAR(64), -- Hash único do dispositivo
    
    -- Características
    device_brand VARCHAR(50),
    device_model VARCHAR(50),
    os_type VARCHAR(50),
    os_version VARCHAR(50),
    browser VARCHAR(50),
    
    -- Rede
    ip_public VARCHAR(45),
    ip_internal VARCHAR(45),
    
    -- Detecção
    detection_method VARCHAR(50), -- 'fingerprint', 'behavior', 'headers'
    confidence_score DECIMAL(5,4),
    
    -- Contagem de visitas
    total_sessions INTEGER DEFAULT 0,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_attacker BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_detections_fingerprint ON network_device_detections(fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_detections_signature ON network_device_detections(device_signature);

-- 6. Tabela de alertas de rede
CREATE TABLE IF NOT EXISTS network_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    alert_type VARCHAR(50) NOT NULL, -- 'new_device', 'suspicious_activity', 'attacker_detected', 'multiple_accounts'
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'danger', 'critical'
    
    -- Visitante relacionado
    visitor_id UUID REFERENCES same_network_visitors(id),
    session_id VARCHAR(64),
    fingerprint VARCHAR(128),
    
    -- Detalhes
    title VARCHAR(255),
    description TEXT,
    metadata JSONB,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_alerts_type ON network_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_network_alerts_severity ON network_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_network_alerts_unread ON network_alerts(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_network_alerts_created ON network_alerts(created_at DESC);

-- 7. Tabela de heatmap de atividade
CREATE TABLE IF NOT EXISTS network_activity_heatmap (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    date DATE NOT NULL,
    hour INTEGER NOT NULL, -- 0-23
    
    -- Contagem
    unique_visitors INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    spotteds_created INTEGER DEFAULT 0,
    comments_created INTEGER DEFAULT 0,
    
    -- Dispositivos
    mobile_count INTEGER DEFAULT 0,
    desktop_count INTEGER DEFAULT 0,
    
    -- Sistemas operacionais
    os_counts JSONB, -- {"Windows": 10, "macOS": 8, "Android": 5, "iOS": 3}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, hour)
);

CREATE INDEX IF NOT EXISTS idx_heatmap_date ON network_activity_heatmap(date DESC);

-- 8. Tabela de análise de conteúdo suspeito
CREATE TABLE IF NOT EXISTS suspicious_content_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    visitor_id UUID REFERENCES same_network_visitors(id),
    session_id VARCHAR(64),
    
    -- Conteúdo
    content_type VARCHAR(20), -- 'spotted', 'comment'
    content_id UUID,
    content_preview TEXT,
    full_content TEXT,
    
    -- Análise
    detected_keywords TEXT[], -- Palavras-chave detectadas
    sentiment_score DECIMAL(5,4), -- -1 (negativo) a 1 (positivo)
    is_harassment BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,
    is_threat BOOLEAN DEFAULT FALSE,
    
    -- Classificação
    auto_classified BOOLEAN DEFAULT FALSE,
    manual_classified BOOLEAN DEFAULT FALSE,
    classification_result VARCHAR(20), -- 'safe', 'suspicious', 'harmful'
    
    -- Ação tomada
    action_taken VARCHAR(50), -- 'none', 'hidden', 'deleted', 'flagged'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suspicious_content_visitor ON suspicious_content_analysis(visitor_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_content_type ON suspicious_content_analysis(content_type);

-- 9. View para dashboard - visitantes ativos hoje
CREATE OR REPLACE VIEW active_visitors_today AS
SELECT 
    sv.id,
    sv.fingerprint,
    sv.device_brand,
    sv.device_model,
    sv.os_type,
    sv.browser,
    sv.ip_public,
    sv.is_known_attacker,
    sv.is_suspicious,
    sv.risk_score,
    sv.total_spotteds,
    sv.total_comments,
    sv.last_visit,
    nas.started_at as current_session_start,
    nas.page_views as current_session_pages,
    nas.spotteds_created as current_session_spotteds
FROM same_network_visitors sv
LEFT JOIN network_activity_sessions nas ON sv.id = nas.visitor_id 
    AND nas.ended_at IS NULL
WHERE sv.last_visit >= CURRENT_DATE
ORDER BY sv.last_visit DESC;

-- 10. View para resumo de dispositivos
CREATE OR REPLACE VIEW device_summary AS
SELECT 
    device_brand,
    device_model,
    os_type,
    browser,
    COUNT(DISTINCT id) as unique_visitors,
    COUNT(*) FILTER (WHERE is_known_attacker) as attacker_count,
    COUNT(*) FILTER (WHERE is_suspicious) as suspicious_count,
    SUM(total_spotteds) as total_spotteds,
    SUM(total_comments) as total_comments,
    AVG(risk_score) as avg_risk_score
FROM same_network_visitors
GROUP BY device_brand, device_model, os_type, browser
ORDER BY unique_visitors DESC;

-- 11. View para analytics de horários
CREATE OR REPLACE VIEW hourly_activity_summary AS
SELECT 
    EXTRACT(HOUR FROM last_visit) as hour,
    COUNT(DISTINCT id) as unique_visitors,
    SUM(total_spotteds) as total_spotteds,
    SUM(total_comments) as total_comments,
    COUNT(*) FILTER (WHERE is_known_attacker) as attacker_visits
FROM same_network_visitors
WHERE last_visit >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM last_visit)
ORDER BY hour;

-- 12. Função para detectar mesmo dispositivo
CREATE OR REPLACE FUNCTION detect_same_device(
    p_fingerprint VARCHAR,
    p_canvas VARCHAR DEFAULT NULL,
    p_webgl VARCHAR DEFAULT NULL,
    p_audio VARCHAR DEFAULT NULL
) RETURNS TABLE (
    visitor_id UUID,
    similarity_score DECIMAL(5,4),
    is_same_device BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sv.id,
        CASE 
            WHEN sv.fingerprint = p_fingerprint THEN 1.0
            WHEN sv.canvas_fingerprint = p_canvas AND p_canvas IS NOT NULL THEN 0.9
            WHEN sv.webgl_fingerprint = p_webgl AND p_webgl IS NOT NULL THEN 0.85
            WHEN sv.audio_fingerprint = p_audio AND p_audio IS NOT NULL THEN 0.8
            ELSE 0.0
        END as similarity_score,
        CASE 
            WHEN sv.fingerprint = p_fingerprint THEN TRUE
            WHEN sv.canvas_fingerprint = p_canvas AND p_canvas IS NOT NULL THEN TRUE
            ELSE FALSE
        END as is_same_device
    FROM same_network_visitors sv
    WHERE 
        sv.fingerprint = p_fingerprint
        OR sv.canvas_fingerprint = p_canvas
        OR sv.webgl_fingerprint = p_webgl
        OR sv.audio_fingerprint = p_audio;
END;
$$ LANGUAGE plpgsql;

-- 13. Função para calcular score de risco avançado
CREATE OR REPLACE FUNCTION calculate_advanced_risk_score(
    p_visitor_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_visitor same_network_visitors%ROWTYPE;
    v_spotteds_last_hour INTEGER;
    v_comments_last_hour INTEGER;
BEGIN
    -- Buscar dados do visitante
    SELECT * INTO v_visitor FROM same_network_visitors WHERE id = p_visitor_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Já marcado como atacante
    IF v_visitor.is_known_attacker THEN
        v_score := v_score + 50;
    END IF;
    
    -- Múltiplas sessões
    IF v_visitor.total_visits > 10 THEN
        v_score := v_score + 10;
    ELSIF v_visitor.total_visits > 5 THEN
        v_score := v_score + 5;
    END IF;
    
    -- Muitos spotteds
    IF v_visitor.total_spotteds > 20 THEN
        v_score := v_score + 15;
    ELSIF v_visitor.total_spotteds > 10 THEN
        v_score := v_score + 8;
    END IF;
    
    -- Atividade de madrugada (0-6h)
    IF v_visitor.last_visit::TIME BETWEEN '00:00:00'::TIME AND '06:00:00'::TIME THEN
        v_score := v_score + 5;
    END IF;
    
    -- Verificar spam na última hora
    SELECT COUNT(*) INTO v_spotteds_last_hour
    FROM network_activity_sessions nas
    JOIN same_network_visitors sv ON nas.visitor_id = sv.id
    WHERE sv.id = p_visitor_id
    AND nas.started_at > NOW() - INTERVAL '1 hour'
    AND nas.spotteds_created > 3;
    
    IF v_spotteds_last_hour > 0 THEN
        v_score := v_score + 25;
    END IF;
    
    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- 14. Trigger para criar alertas automáticos
CREATE OR REPLACE FUNCTION create_network_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Novo dispositivo detectado
    IF TG_TABLE_NAME = 'same_network_visitors' AND TG_OP = 'INSERT' THEN
        INSERT INTO network_alerts (alert_type, severity, visitor_id, fingerprint, title, description)
        VALUES (
            'new_device',
            CASE WHEN NEW.is_known_attacker THEN 'danger' ELSE 'info' END,
            NEW.id,
            NEW.fingerprint,
            'Novo dispositivo detectado',
            'Dispositivo: ' || COALESCE(NEW.device_brand, 'Desconhecido') || ' ' || COALESCE(NEW.device_model, '') || ' | OS: ' || COALESCE(NEW.os_type, 'Desconhecido')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_network_alert ON same_network_visitors;
CREATE TRIGGER trigger_create_network_alert
    AFTER INSERT ON same_network_visitors
    FOR EACH ROW
    EXECUTE FUNCTION create_network_alert();

-- 15. Políticas RLS (Row Level Security)
ALTER TABLE same_network_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_alerts ENABLE ROW LEVEL SECURITY;

-- Política para admin (service_role pode ver tudo)
CREATE POLICY "Service role can do everything" ON same_network_visitors
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON network_activity_sessions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON network_alerts
    FOR ALL TO service_role USING (true) WITH CHECK (true);
