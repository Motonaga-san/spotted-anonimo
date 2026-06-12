-- Adicionar coluna para fingerprint robusto
-- Execute no Supabase SQL Editor

-- Adicionar coluna de fingerprint hash único
ALTER TABLE reports ADD COLUMN IF NOT EXISTS fingerprint_hash TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS fingerprint_data JSONB;

-- Adicionar colunas nos spotteds também
ALTER TABLE spotteds ADD COLUMN IF NOT EXISTS fingerprint_hash TEXT;

-- Adicionar colunas nos comments também
ALTER TABLE comments ADD COLUMN IF NOT EXISTS fingerprint_hash TEXT;

-- Criar índice para buscas rápidas por fingerprint
CREATE INDEX IF NOT EXISTS idx_reports_fingerprint_hash ON reports(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_spotteds_fingerprint_hash ON spotteds(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_comments_fingerprint_hash ON comments(fingerprint_hash);

-- Comentários
COMMENT ON COLUMN reports.fingerprint_hash IS 'Hash único do dispositivo (58 campos combinados)';
COMMENT ON COLUMN reports.fingerprint_data IS 'Dados completos do fingerprint em JSON';
COMMENT ON COLUMN spotteds.fingerprint_hash IS 'Hash único do dispositivo que criou o post';
COMMENT ON COLUMN comments.fingerprint_hash IS 'Hash único do dispositivo que criou o comentário';
