-- =====================================================
-- CORREÇÃO DEFINITIVA DO SISTEMA DE CRIAÇÃO DE USUÁRIOS
-- =====================================================

-- 1. Primeiro, vamos verificar se existe trigger e função
DO $$
BEGIN
  RAISE NOTICE 'Verificando estado atual do sistema...';
  
  -- Verificar se a função existe
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE NOTICE 'Função handle_new_user EXISTS';
  ELSE
    RAISE NOTICE 'Função handle_new_user NÃO EXISTE';
  END IF;
  
  -- Verificar se o trigger existe
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE NOTICE 'Trigger on_auth_user_created EXISTS';
  ELSE
    RAISE NOTICE 'Trigger on_auth_user_created NÃO EXISTE';
  END IF;
END $$;

-- 2. Limpar completamente o que existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Criar função com logs mais detalhados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_phone TEXT;
BEGIN
  -- Log inicial
  RAISE WARNING '[TRIGGER] handle_new_user INICIADO para usuário ID: %, Email: %', NEW.id, NEW.email;
  
  -- Extrair dados do metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name', 
    ''
  );
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  
  RAISE WARNING '[TRIGGER] Dados extraídos - Nome: %, Telefone: %', user_full_name, user_phone;
  RAISE WARNING '[TRIGGER] Metadata completo: %', NEW.raw_user_meta_data;
  
  -- 1. Confirmar email automaticamente
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  RAISE WARNING '[TRIGGER] Email confirmado para usuário: %', NEW.id;
  
  -- 2. Criar usuário na tabela poupeja_users
  INSERT INTO public.poupeja_users (id, email, name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_phone,
    NOW(),
    NOW()
  );
  
  RAISE WARNING '[TRIGGER] ✅ Usuário criado com SUCESSO na tabela poupeja_users: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING '[TRIGGER] ⚠️ Usuário já existe na tabela poupeja_users: %', NEW.id;
    RETURN NEW;
  WHEN others THEN
    RAISE WARNING '[TRIGGER] ❌ ERRO ao criar usuário em poupeja_users: % - %, SQLSTATE: %', SQLERRM, SQLSTATE, SQLSTATE;
    RAISE WARNING '[TRIGGER] ❌ Dados que causaram erro - ID: %, Email: %, Nome: %, Phone: %', NEW.id, NEW.email, user_full_name, user_phone;
    RETURN NEW; -- Não falhar o signup
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger on_auth_user_created RECRIADO com sucesso';
END $$;

-- 5. Criar função de teste para verificar se está funcionando
CREATE OR REPLACE FUNCTION public.test_user_creation_system()
RETURNS TEXT AS $$
DECLARE
  test_result TEXT := '';
BEGIN
  -- Verificar se a função existe
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    test_result := test_result || '✅ Função handle_new_user existe' || chr(10);
  ELSE
    test_result := test_result || '❌ Função handle_new_user NÃO existe' || chr(10);
  END IF;
  
  -- Verificar se o trigger existe
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    test_result := test_result || '✅ Trigger on_auth_user_created existe' || chr(10);
  ELSE
    test_result := test_result || '❌ Trigger on_auth_user_created NÃO existe' || chr(10);
  END IF;
  
  -- Verificar permissões da tabela
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'poupeja_users' AND table_schema = 'public') THEN
    test_result := test_result || '✅ Tabela poupeja_users existe' || chr(10);
  ELSE
    test_result := test_result || '❌ Tabela poupeja_users NÃO existe' || chr(10);
  END IF;
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Executar o teste
SELECT public.test_user_creation_system();

-- 7. Recuperar usuários existentes (se houver)
DO $$
DECLARE
  recovered_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Iniciando recuperação de usuários existentes...';
  
  INSERT INTO public.poupeja_users (id, email, name, phone, created_at, updated_at)
  SELECT 
    au.id, 
    au.email, 
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), 
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    NOW(),
    NOW()
  FROM auth.users au
  LEFT JOIN public.poupeja_users pu ON au.id = pu.id
  WHERE pu.id IS NULL;
  
  GET DIAGNOSTICS recovered_count = ROW_COUNT;
  RAISE NOTICE '✅ Recuperados % usuários durante a migração', recovered_count;
END $$;

-- 7. Log final
DO $$
BEGIN
  RAISE NOTICE '🎉 Sistema de criação de usuários configurado com sucesso!';
END $$;