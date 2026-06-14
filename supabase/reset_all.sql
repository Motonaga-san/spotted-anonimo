-- Reset total do sistema Spotted 2.0
-- Execute este script no Supabase SQL Editor

-- 1. Criar função para resetar sequência (se não existir)
CREATE OR REPLACE FUNCTION reset_sequence(sequence_name text, restart_value integer DEFAULT 1)
RETURNS void AS $$
BEGIN
    EXECUTE format('ALTER SEQUENCE IF EXISTS %I RESTART WITH %s', sequence_name, restart_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Resetar todas as tabelas
DELETE FROM user_likes WHERE 1=1;
DELETE FROM security_events WHERE 1=1;
DELETE FROM visitor_sessions WHERE 1=1;
DELETE FROM daily_stats WHERE 1=1;
DELETE FROM page_views WHERE 1=1;
DELETE FROM reports WHERE 1=1;
DELETE FROM comments WHERE 1=1;
DELETE FROM spotteds WHERE 1=1;

-- 3. Resetar sequência do contador de spotteds
ALTER SEQUENCE IF EXISTS spotteds_number_seq RESTART WITH 1;
SELECT setval('spotteds_number_seq', 1, false);

-- 4. Verificar resultado
SELECT 
    (SELECT COUNT(*) FROM spotteds) as spotteds,
    (SELECT COUNT(*) FROM comments) as comments,
    (SELECT COUNT(*) FROM reports) as reports,
    (SELECT COUNT(*) FROM user_likes) as user_likes,
    (SELECT COUNT(*) FROM security_events) as security_events,
    (SELECT COUNT(*) FROM visitor_sessions) as visitor_sessions,
    (SELECT last_value FROM spotteds_number_seq) as next_spotted_number;
