-- =====================================================
-- SCRIPT SQL PARA CRIAR TABELAS DE ANALYTICS
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar colunas faltantes na tabela spotteds
ALTER TABLE spotteds ADD COLUMN IF NOT EXISTS author_fingerprint TEXT;
ALTER TABLE spotteds ADD COLUMN IF NOT EXISTS author_ip TEXT;
ALTER TABLE spotteds ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE spotteds ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0;

-- 2. Adicionar coluna country em page_views
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS country TEXT;

-- 3. Adicionar coluna author_fingerprint em comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_fingerprint TEXT;

-- 4. Adicionar coluna reporter_fingerprint em reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_fingerprint TEXT;

-- 5. Criar tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  visitor_ip TEXT,
  visitor_fingerprint TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  page TEXT,
  element_clicked TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_fingerprint ON analytics_events(visitor_fingerprint);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- 7. Criar tabela de sessões de usuário
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  visitor_fingerprint TEXT,
  visitor_ip TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  first_page TEXT,
  referrer TEXT,
  page_views INTEGER DEFAULT 1,
  spotteds_created INTEGER DEFAULT 0,
  comments_created INTEGER DEFAULT 0,
  likes_given INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Criar índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_fingerprint ON user_sessions(visitor_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_sessions_country ON user_sessions(country);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started ON user_sessions(started_at);

-- 9. Habilitar RLS nas novas tabelas
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para analytics_events (apenas service_role pode acessar)
CREATE POLICY "Service role can manage analytics_events" ON analytics_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 11. Políticas RLS para user_sessions (apenas service_role pode acessar)
CREATE POLICY "Service role can manage user_sessions" ON user_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 12. Política para permitir insert anônimo (para tracking)
CREATE POLICY "Anyone can insert analytics_events" ON analytics_events
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anyone can insert user_sessions" ON user_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anyone can update user_sessions" ON user_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
