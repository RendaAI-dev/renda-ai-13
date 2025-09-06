-- =====================================================
-- CORREÇÃO COMPLETA DO SISTEMA DE CRIAÇÃO DE USUÁRIOS
-- =====================================================

-- 1. Remover função e trigger existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Criar função unificada que:
--    - Confirma email automaticamente
--    - Cria usuário na tabela poupeja_users
--    - Trata erros sem quebrar o processo de signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log da tentativa de criação
  RAISE LOG 'Trigger handle_new_user executado para usuário ID: %', NEW.id;
  
  -- 1. Confirmar email automaticamente
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  -- 2. Criar usuário na tabela poupeja_users
  INSERT INTO public.poupeja_users (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  RAISE LOG 'Usuário criado com sucesso na tabela poupeja_users: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Se o usuário já existe, apenas log e continua
    RAISE LOG 'Usuário já existe na tabela poupeja_users: %', NEW.id;
    RETURN NEW;
  WHEN others THEN
    -- Log erro mas não falhe o signup
    RAISE WARNING 'Erro ao criar usuário em poupeja_users: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Recuperar usuários existentes que não estão na tabela poupeja_users
-- Esta parte executa a recuperação automaticamente durante a migração
DO $$
DECLARE
  recovered_count INTEGER := 0;
BEGIN
  -- Inserir usuários que existem em auth.users mas não em poupeja_users
  INSERT INTO public.poupeja_users (id, email, name, phone)
  SELECT 
    au.id, 
    au.email, 
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), 
    COALESCE(au.raw_user_meta_data->>'phone', '')
  FROM auth.users au
  LEFT JOIN public.poupeja_users pu ON au.id = pu.id
  WHERE pu.id IS NULL;
  
  GET DIAGNOSTICS recovered_count = ROW_COUNT;
  RAISE NOTICE 'Recuperados % usuários durante a migração', recovered_count;
END
$$;

-- 5. Comentários para documentação
-- Esta migração:
-- ✅ Corrige o trigger para criar usuários em poupeja_users
-- ✅ Mantém a confirmação automática de email
-- ✅ Recupera usuários existentes automaticamente
-- ✅ Trata erros sem quebrar o processo de signup