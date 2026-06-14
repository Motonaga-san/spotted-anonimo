-- =============================================
-- TABELA DE LIKES ÚNICOS
-- Impede que o mesmo usuário curta múltiplas vezes
-- =============================================

CREATE TABLE IF NOT EXISTS user_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_fingerprint VARCHAR(128) NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('spotted', 'comment')),
    item_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint única: um fingerprint só pode curtir um item uma vez
    UNIQUE(user_fingerprint, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_likes_fingerprint ON user_likes(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_likes_item ON user_likes(item_type, item_id);

-- RLS Policy
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_likes_insert" ON user_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "user_likes_select" ON user_likes FOR SELECT USING (true);

-- Função para verificar se usuário já curtiu
CREATE OR REPLACE FUNCTION has_user_liked(
    p_fingerprint VARCHAR,
    p_item_type VARCHAR,
    p_item_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_likes 
        WHERE user_fingerprint = p_fingerprint 
        AND item_type = p_item_type 
        AND item_id = p_item_id
    );
END;
$$ LANGUAGE plpgsql;
