-- Adicionar colunas de rastreamento à tabela comments
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna author_ip se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'author_ip') THEN
    ALTER TABLE comments ADD COLUMN author_ip TEXT;
  END IF;
END $$;

-- Adicionar coluna author_fingerprint se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'author_fingerprint') THEN
    ALTER TABLE comments ADD COLUMN author_fingerprint TEXT;
  END IF;
END $$;

-- Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'comments' 
ORDER BY ordinal_position;
