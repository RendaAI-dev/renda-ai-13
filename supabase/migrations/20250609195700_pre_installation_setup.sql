-- ========================================================================
-- PRÉ-INSTALAÇÃO: PREPARAÇÃO DO SISTEMA
-- ========================================================================
-- IMPORTANTE: O usuário admin@admin.com será criado após a instalação
-- usando a Edge Function 'create-admin-user' que utiliza a API oficial do Supabase
-- Data: 2025-07-12
-- Versão: 3.0 (Atualizada)

-- PREPARAÇÃO INICIAL DO SISTEMA
-- Esta migração prepara o ambiente antes das outras migrações serem executadas

-- Preparação do sistema
DO $$
BEGIN
    RAISE NOTICE 'Iniciando preparação do sistema...';
    
    -- UUID extension é necessária para IDs
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RAISE NOTICE 'Extensão uuid-ossp será criada automaticamente pelas próximas migrações';
    END IF;
    
    RAISE NOTICE 'Pré-instalação preparada. Execute a edge function create-admin-user após o deploy para criar o usuário admin.';
END $$;