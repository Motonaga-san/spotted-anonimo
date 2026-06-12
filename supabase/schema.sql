-- Tabela de Spotteds
CREATE TABLE spotteds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 500),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas por status
CREATE INDEX idx_spotteds_status ON spotteds(status);
CREATE INDEX idx_spotteds_created_at ON spotteds(created_at DESC);

-- Políticas RLS (Row Level Security)
ALTER TABLE spotteds ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode inserir (spotted anônimo)
CREATE POLICY "Anyone can insert" ON spotteds
  FOR INSERT WITH CHECK (status = 'pending');

-- Qualquer um pode ver apenas aprovados
CREATE POLICY "Anyone can view approved" ON spotteds
  FOR SELECT USING (status = 'approved');
