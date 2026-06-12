-- Tabela para guardar histórico completo de posts e comentários
-- Inclui informações do autor para rastreamento

CREATE TABLE IF NOT EXISTS content_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tipo de conteúdo
  content_type TEXT NOT NULL CHECK (content_type IN ('spotted', 'comment')),
  content_id UUID NOT NULL,
  
  -- Referências
  spotted_id UUID REFERENCES spotteds(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  
  -- Conteúdo original
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- Informações do autor
  author_ip TEXT,
  author_fingerprint TEXT,
  author_user_agent TEXT,
  
  -- Status e moderação
  status TEXT DEFAULT 'approved',
  action TEXT CHECK (action IN ('created', 'approved', 'reported', 'hidden', 'deleted', 'restored')),
  
  -- Metadados
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  INDEX idx_content_history_type (content_type),
  INDEX idx_content_history_content_id (content_id),
  INDEX idx_content_history_author_ip (author_ip),
  INDEX idx_content_history_author_fingerprint (author_fingerprint)
);

-- Função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION log_content_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_history (
    content_type,
    content_id,
    content,
    content_html,
    author_ip,
    author_fingerprint,
    status,
    action,
    likes
  ) VALUES (
    TG_TABLE_NAME,
    NEW.id,
    COALESCE(NEW.message, NEW.content),
    COALESCE(NEW.message_html, NEW.content_html),
    NEW.author_ip,
    NEW.author_fingerprint,
    NEW.status,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 
        CASE 
          WHEN OLD.status != NEW.status THEN NEW.status
          ELSE 'updated'
        END
    END,
    NEW.likes
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para spotteds
DROP TRIGGER IF EXISTS log_spotted_history ON spotteds;
CREATE TRIGGER log_spotted_history
  AFTER INSERT OR UPDATE ON spotteds
  FOR EACH ROW EXECUTE FUNCTION log_content_history();

-- Triggers para comments
DROP TRIGGER IF EXISTS log_comment_history ON comments;
CREATE TRIGGER log_comment_history
  AFTER INSERT OR UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION log_content_history();

-- Habilitar RLS
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

-- Política para admin (service_role pode ver tudo)
CREATE POLICY "Service role can read all history" ON content_history
  FOR SELECT TO service_role USING (true);

-- Política para usuários anônimos (não podem ver)
CREATE POLICY "Anonymous cannot read history" ON content_history
  FOR ALL TO anon USING (false);

-- Comentários sobre as colunas
COMMENT ON TABLE content_history IS 'Histórico completo de posts e comentários para auditoria e moderação';
COMMENT ON COLUMN content_history.author_ip IS 'Endereço IP do autor no momento da criação';
COMMENT ON COLUMN content_history.author_fingerprint IS 'Fingerprint do navegador do autor';
COMMENT ON COLUMN content_history.author_user_agent IS 'User agent do navegador do autor';
COMMENT ON COLUMN content_history.action IS 'Ação realizada: created, approved, reported, hidden, deleted, restored';
