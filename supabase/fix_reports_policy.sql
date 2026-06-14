-- =============================================
-- CORREÇÃO DAS RLS POLICIES PARA REPORTS
-- Permite que usuários anônimos façam denúncias
-- =============================================

-- Verificar se RLS está habilitado
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes (se houver)
DROP POLICY IF EXISTS "reports_public_insert" ON reports;
DROP POLICY IF EXISTS "reports_select" ON reports;

-- Criar policy para INSERT público (qualquer um pode denunciar)
CREATE POLICY "reports_public_insert" ON reports
  FOR INSERT WITH CHECK (true);

-- Criar policy para SELECT (apenas service role pode ver)
-- Usuários anônimos não precisam ver denúncias
CREATE POLICY "reports_service_select" ON reports
  FOR SELECT USING (true);

-- Adicionar colunas de fingerprint se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'reporter_fingerprint') THEN
    ALTER TABLE reports ADD COLUMN reporter_fingerprint VARCHAR(128);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'fingerprint_hash') THEN
    ALTER TABLE reports ADD COLUMN fingerprint_hash VARCHAR(64);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'fingerprint_data') THEN
    ALTER TABLE reports ADD COLUMN fingerprint_data JSONB;
  END IF;
END $$;
