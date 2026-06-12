-- Adiciona coluna de likes se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spotteds' AND column_name = 'likes'
  ) THEN
    ALTER TABLE spotteds ADD COLUMN likes INTEGER DEFAULT 0;
  END IF;
END $$;

-- Adiciona coluna de reports se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spotteds' AND column_name = 'reports'
  ) THEN
    ALTER TABLE spotteds ADD COLUMN reports INTEGER DEFAULT 0;
  END IF;
END $$;

-- Atualiza políticas para permitir updates (para likes)
DROP POLICY IF EXISTS "Allow all insert" ON spotteds;
DROP POLICY IF EXISTS "Allow all select" ON spotteds;
DROP POLICY IF EXISTS "Allow all update" ON spotteds;
DROP POLICY IF EXISTS "Allow all delete" ON spotteds;

-- Novas políticas
CREATE POLICY "Allow all insert" ON spotteds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all select" ON spotteds
  FOR SELECT USING (true);

CREATE POLICY "Allow update likes" ON spotteds
  FOR UPDATE USING (true)
  WITH CHECK (true);
