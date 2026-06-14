-- Descobrir sequências existentes
SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public';

-- Verificar estrutura da tabela spotteds
SELECT column_name, column_default, data_type 
FROM information_schema.columns 
WHERE table_name = 'spotteds' AND table_schema = 'public';

-- Listar todas as sequências
SELECT relname FROM pg_class WHERE relkind = 'S' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
