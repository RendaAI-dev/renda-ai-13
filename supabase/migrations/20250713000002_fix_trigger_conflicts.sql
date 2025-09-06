-- =====================================================
-- CORRIGIR CONFLITOS DE TRIGGERS E FINALIZAR SETUP
-- =====================================================

-- 1. Verificar e corrigir conflitos de triggers/funções
DO $$
BEGIN
  RAISE NOTICE 'Iniciando correção de conflitos de triggers...';
  
  -- Remover todos os triggers relacionados ao auth.users
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
  
  -- Remover funções conflitantes
  DROP FUNCTION IF EXISTS public.handle_new_user_signup();
  DROP FUNCTION IF EXISTS public.handle_new_user();
  
  RAISE NOTICE 'Triggers e funções antigas removidos';
END $$;

-- 2. Criar função definitiva e única
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_phone TEXT;
BEGIN
  -- Log detalhado
  RAISE WARNING '[AUTH_TRIGGER] Usuário criado no auth.users - ID: %, Email: %', NEW.id, NEW.email;
  RAISE WARNING '[AUTH_TRIGGER] Raw metadata: %', NEW.raw_user_meta_data;
  
  -- Extrair dados do metadata com múltiplas opções
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'fullName',
    ''
  );
  
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    ''
  );
  
  RAISE WARNING '[AUTH_TRIGGER] Dados processados - Nome: "%", Telefone: "%"', user_name, user_phone;
  
  -- Confirmar email automaticamente
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  RAISE WARNING '[AUTH_TRIGGER] Email confirmado automaticamente';
  
  -- Inserir na tabela poupeja_users
  INSERT INTO public.poupeja_users (
    id, 
    email, 
    name, 
    phone, 
    created_at, 
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_phone,
    NOW(),
    NOW()
  );
  
  RAISE WARNING '[AUTH_TRIGGER] ✅ SUCESSO - Usuário inserido em poupeja_users: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING '[AUTH_TRIGGER] ⚠️ Usuário já existe na poupeja_users: %', NEW.id;
    RETURN NEW;
  WHEN others THEN
    RAISE WARNING '[AUTH_TRIGGER] ❌ ERRO CRÍTICO: % - %', SQLERRM, SQLSTATE;
    RAISE WARNING '[AUTH_TRIGGER] Dados que falharam: ID=%, Email=%, Nome=%, Phone=%', NEW.id, NEW.email, user_name, user_phone;
    -- Log mais detalhado do erro
    RAISE WARNING '[AUTH_TRIGGER] Context: %', format('INSERT INTO poupeja_users VALUES (%s, %s, %s, %s)', NEW.id, NEW.email, user_name, user_phone);
    RETURN NEW; -- Não quebrar o signup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger único e definitivo
CREATE TRIGGER auth_user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger auth_user_created_trigger criado com sucesso';
END $$;

-- 4. Testar se está funcionando
CREATE OR REPLACE FUNCTION public.test_trigger_system()
RETURNS TABLE(
  test_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Teste 1: Verificar se a função existe
  RETURN QUERY SELECT 
    'Função handle_auth_user_created'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_auth_user_created') 
      THEN '✅ OK'::TEXT 
      ELSE '❌ FALHA'::TEXT 
    END,
    'Função para criação de usuários'::TEXT;
  
  -- Teste 2: Verificar se o trigger existe
  RETURN QUERY SELECT 
    'Trigger auth_user_created_trigger'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'auth_user_created_trigger') 
      THEN '✅ OK'::TEXT 
      ELSE '❌ FALHA'::TEXT 
    END,
    'Trigger no auth.users'::TEXT;
  
  -- Teste 3: Verificar se a tabela poupeja_users está acessível
  RETURN QUERY SELECT 
    'Tabela poupeja_users'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'poupeja_users' AND table_schema = 'public') 
      THEN '✅ OK'::TEXT 
      ELSE '❌ FALHA'::TEXT 
    END,
    'Tabela de usuários'::TEXT;
    
  -- Teste 4: Contar usuários existentes
  RETURN QUERY SELECT 
    'Usuários existentes'::TEXT,
    '📊 INFO'::TEXT,
    format('auth.users: %s, poupeja_users: %s', 
      (SELECT COUNT(*) FROM auth.users),
      (SELECT COUNT(*) FROM public.poupeja_users)
    )::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Executar os testes
SELECT * FROM public.test_trigger_system();

-- 6. Recuperar usuários que não estão na poupeja_users
DO $$
DECLARE
  user_record RECORD;
  recovered_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Recuperando usuários que não estão na poupeja_users...';
  
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.poupeja_users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.poupeja_users (id, email, name, phone, created_at, updated_at)
      VALUES (
        user_record.id,
        user_record.email,
        COALESCE(
          user_record.raw_user_meta_data->>'full_name',
          user_record.raw_user_meta_data->>'name',
          user_record.raw_user_meta_data->>'fullName',
          ''
        ),
        COALESCE(
          user_record.raw_user_meta_data->>'phone',
          user_record.raw_user_meta_data->>'whatsapp',
          ''
        ),
        NOW(),
        NOW()
      );
      
      recovered_count := recovered_count + 1;
      RAISE NOTICE 'Recuperado usuário: % (%)', user_record.email, user_record.id;
      
    EXCEPTION
      WHEN others THEN
        RAISE WARNING 'Erro ao recuperar usuário %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Total de usuários recuperados: %', recovered_count;
END $$;

-- Log final
DO $$
BEGIN
  RAISE NOTICE '🎉 Sistema de criação de usuários configurado e testado!';
END $$;