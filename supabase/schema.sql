-- =============================================
-- SPOTTED 2.0 - SCHEMA COMPLETO
-- =============================================

-- 1. Tabela de Spotteds (atualizada)
CREATE TABLE IF NOT EXISTS spotteds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER UNIQUE DEFAULT nextval('spotted_number_seq'),
  message TEXT NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 2000),
  message_html TEXT, -- versão com formatação HTML
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'reported', 'hidden')),
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  reports_count INTEGER DEFAULT 0,
  author_ip VARCHAR(45),
  author_fingerprint VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sequência para numeração
CREATE SEQUENCE IF NOT EXISTS spotted_number_seq START 1;

-- Trigger para auto-incrementar número
CREATE OR REPLACE FUNCTION auto_spotted_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.number := nextval('spotted_number_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_spotted_number ON spotteds;
CREATE TRIGGER set_spotted_number
  BEFORE INSERT ON spotteds
  FOR EACH ROW
  WHEN (NEW.number IS NULL)
  EXECUTE FUNCTION auto_spotted_number();

-- 2. Tabela de Comentários
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spotted_id UUID REFERENCES spotteds(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  content_html TEXT,
  likes INTEGER DEFAULT 0,
  author_ip VARCHAR(45),
  author_fingerprint VARCHAR(64),
  status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('approved', 'reported', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Denúncias
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spotted_id UUID REFERENCES spotteds(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 3),
  reporter_ip VARCHAR(45),
  reporter_fingerprint VARCHAR(64),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Visualizações de Página
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page VARCHAR(100) NOT NULL,
  visitor_ip VARCHAR(45),
  visitor_fingerprint VARCHAR(64),
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Estatísticas Diárias
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  spotteds_created INTEGER DEFAULT 0,
  comments_created INTEGER DEFAULT 0,
  reports_created INTEGER DEFAULT 0,
  likes_given INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_spotteds_number ON spotteds(number);
CREATE INDEX IF NOT EXISTS idx_spotteds_status ON spotteds(status);
CREATE INDEX IF NOT EXISTS idx_spotteds_created_at ON spotteds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_spotted_id ON comments(spotted_id);
CREATE INDEX IF NOT EXISTS idx_reports_spotted_id ON reports(spotted_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- RLS (Row Level Security)
ALTER TABLE spotteds ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para Spotteds
CREATE POLICY "spotteds_public_select" ON spotteds
  FOR SELECT USING (status = 'approved');

CREATE POLICY "spotteds_public_insert" ON spotteds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "spotteds_public_update" ON spotteds
  FOR UPDATE USING (true);

-- Políticas para Comentários
CREATE POLICY "comments_public_select" ON comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "comments_public_insert" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "comments_public_update" ON comments
  FOR UPDATE USING (true);

-- Políticas para Denúncias
CREATE POLICY "reports_public_insert" ON reports
  FOR INSERT WITH CHECK (true);

-- Políticas para Page Views
CREATE POLICY "pageviews_public_insert" ON page_views
  FOR INSERT WITH CHECK (true);

-- Políticas para Daily Stats
CREATE POLICY "dailystats_public_select" ON daily_stats
  FOR SELECT USING (true);

-- Função para atualizar estatísticas diárias
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS void AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  INSERT INTO daily_stats (date, page_views, unique_visitors, spotteds_created, comments_created, reports_created, likes_given)
  SELECT 
    today_date,
    (SELECT COUNT(*) FROM page_views WHERE DATE(created_at) = today_date),
    (SELECT COUNT(DISTINCT visitor_fingerprint) FROM page_views WHERE DATE(created_at) = today_date),
    (SELECT COUNT(*) FROM spotteds WHERE DATE(created_at) = today_date),
    (SELECT COUNT(*) FROM comments WHERE DATE(created_at) = today_date),
    (SELECT COUNT(*) FROM reports WHERE DATE(created_at) = today_date),
    0
  ON CONFLICT (date) DO UPDATE SET
    page_views = EXCLUDED.page_views,
    unique_visitors = EXCLUDED.unique_visitors,
    spotteds_created = EXCLUDED.spotteds_created,
    comments_created = EXCLUDED.comments_created,
    reports_created = EXCLUDED.reports_created;
END;
$$ LANGUAGE plpgsql;
