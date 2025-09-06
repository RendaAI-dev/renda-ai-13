-- =====================================================
-- CRIAR FUNÇÃO update_updated_at_column SE NÃO EXISTIR
-- =====================================================

-- Verificar se a função update_updated_at_column existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    RAISE NOTICE 'Função update_updated_at_column NÃO existe. Criando...';
    
    -- Criar a função
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    RAISE NOTICE '✅ Função update_updated_at_column criada com sucesso';
  ELSE
    RAISE NOTICE '✅ Função update_updated_at_column já existe';
  END IF;
END $$;

-- Garantir que o trigger na tabela poupeja_users existe
DROP TRIGGER IF EXISTS update_poupeja_users_updated_at ON public.poupeja_users;

CREATE TRIGGER update_poupeja_users_updated_at
  BEFORE UPDATE ON public.poupeja_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Log final
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger update_poupeja_users_updated_at configurado';
END $$;